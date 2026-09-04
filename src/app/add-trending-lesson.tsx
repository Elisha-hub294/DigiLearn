import { extractYoutubeId, getVideoThumbnailUrl } from "@/utils/videoUtils";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db, functions } from "../../firebaseConfig";
import { getTitleDocId } from "../components/library/add-item/utils";
import { AdminPublishHeader } from "../components/library/AdminPublishHeader";
import { useSubjects } from "../components/ui/SubjectFilter";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { invalidateFirestoreReadCache } from "../services/firestoreReadCache";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../services/notifications";
import { invalidateLocalCaches, LOCAL_CACHE_KEYS } from "../utils/localCache";

function formatDurationFromSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function isValidYouTubeVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  const videoId = extractYoutubeId(trimmed);
  if (!videoId) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const isYouTubeHost =
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host.endsWith(".youtube.com");

    return isYouTubeHost;
  } catch {
    return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)/i.test(
      trimmed,
    );
  }
}

function formatLessonTitle(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s\/]/gu, "").replace(/\s+/g, " ");
}

async function fetchYoutubeVideoMeta(videoUrl: string) {
  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) {
    return { title: "", description: "", duration: "", thumbnail: "" };
  }

  const apiKey =
    process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    "";

  try {
    let serverDuration = "";
    try {
      const getYoutubeVideoDuration = httpsCallable<
        { videoId: string },
        { duration?: number | null }
      >(functions, "getYoutubeVideoDuration");
      const durationResult = await getYoutubeVideoDuration({ videoId });
      const totalSeconds = durationResult.data.duration;
      if (typeof totalSeconds === "number") {
        serverDuration = formatDurationFromSeconds(totalSeconds);
      }
    } catch {}

    if (apiKey) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`,
      );
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        const title = item?.snippet?.title || "";
        const description = item?.snippet?.description || "";
        const durationISO = item?.contentDetails?.duration;

        if (durationISO) {
          const match = durationISO.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
          );
          if (match) {
            const hours = Number(match[1] || 0);
            const minutes = Number(match[2] || 0);
            const seconds = Number(match[3] || 0);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;

            return {
              title,
              description,
              duration:
                formatDurationFromSeconds(totalSeconds) || serverDuration,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            };
          }
        }

        if (title) {
          return {
            title,
            description,
            duration: serverDuration,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
      }
    }

    const oEmbedResponse = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
    );

    if (oEmbedResponse.ok) {
      const data = await oEmbedResponse.json();

      return {
        title: typeof data.title === "string" ? data.title : "",
        description: "",
        duration: serverDuration,
        thumbnail:
          typeof data.thumbnail_url === "string"
            ? data.thumbnail_url
            : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    return {
      title: "",
      description: "",
      duration: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      title: "",
      description: "",
      duration: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

export default function AddTrendingLessonScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [link, setLink] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const canAddSubject =
    Boolean(subject) &&
    selectedSubjects.length < 3 &&
    !selectedSubjects.includes(subject);

  const teacherName =
    profile?.name || auth.currentUser?.displayName || "Teacher";

  const teacherAvatar =
    profile?.photoURL && profile.photoURL.trim()
      ? profile.photoURL
      : auth.currentUser?.photoURL && auth.currentUser.photoURL.trim()
        ? auth.currentUser.photoURL
        : "";

  const handleTitleChange = (value: string) => {
    setTitle(formatLessonTitle(value));
  };

  const handleLinkChange = async (value: string) => {
    setLink(value);

    if (!value.trim()) {
      setLinkError("");
      setDuration("");
      setThumbnail("");
      setTitle("");
      setDescription("");
      return;
    }

    if (!isValidYouTubeVideoUrl(value)) {
      setLinkError("Only YouTube video links are allowed.");
      setDuration("");
      setThumbnail("");
      setTitle("");
      setDescription("");
      setMetaLoading(false);
      return;
    }

    setLinkError("");
    setMetaLoading(true);
    try {
      const meta = await fetchYoutubeVideoMeta(value.trim());
      setDuration(meta.duration || "");
      setThumbnail(meta.thumbnail || "");
      setDescription(meta.description || "");
      if (meta.title && !title.trim()) {
        setTitle(formatLessonTitle(meta.title));
      }
    } catch {
      setDuration("");
      setThumbnail("");
      setTitle("");
      setDescription("");
    } finally {
      setMetaLoading(false);
    }
  };

  const handlePasteLink = async () => {
    setPasteLoading(true);
    try {
      const pastedLink = (await Clipboard.getStringAsync()).trim();
      if (pastedLink) {
        await handleLinkChange(pastedLink);
      }
    } catch {
      setLinkError("Unable to read a link from the clipboard.");
    } finally {
      setPasteLoading(false);
    }
  };

  async function handleSubmit() {
    const formattedTitle = formatLessonTitle(title).trim();

    if (!formattedTitle || !isValidYouTubeVideoUrl(link)) {
      return;
    }

    setLoading(true);
    try {
      const finalThumbnail = getVideoThumbnailUrl(
        thumbnail.trim(),
        link.trim(),
      );
      const finalDuration = duration.trim() || "00:00";
      const teacherValue = teacherName.trim() || "Teacher";
      const avatarValue = teacherAvatar.trim();
      const subjectsToSave = [
        ...selectedSubjects,
        ...(subject && subject !== "All" ? [subject] : []),
      ];
      const savedSubject =
        subjectsToSave.length > 1
          ? subjectsToSave
          : subjectsToSave[0] || "General";
      const lessonId = `${getTitleDocId(formattedTitle)}-${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      await setDoc(doc(db, "trendingLessons", lessonId), {
        id: lessonId,
        title: formattedTitle,
        description: description.trim(),
        subject: savedSubject,
        teacher: teacherValue,
        uploadedAt: serverTimestamp(),
        duration: finalDuration,
        thumbnail: finalThumbnail,
        link: link.trim(),
        avatar: avatarValue,
        owner: auth.currentUser?.uid ?? "",
      });
      await invalidateLocalCaches(
        LOCAL_CACHE_KEYS.trending,
        LOCAL_CACHE_KEYS.search,
      );
      invalidateFirestoreReadCache("collection:trendingLessons");

      if (notifyUsers) {
        await appendNotificationToAllUsers(
          buildLibraryNotification(
            "lesson",
            lessonId,
            undefined,
            undefined,
            formattedTitle,
            finalThumbnail,
          ),
        );
      }

      router.replace("/videos");
    } catch (error) {
      console.error("Failed to add lesson", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <AdminPublishHeader title="Add Lesson" onBack={() => router.back()} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.helperText}>
            Paste a YouTube link to auto-fill the lesson details.
          </Text>

          <Text style={styles.label}>YouTube Link</Text>
          <View style={styles.linkInputRow}>
            <TextInput
              value={link}
              onChangeText={handleLinkChange}
              placeholder="https://www.youtube.com/watch?v=..."
              style={[
                styles.input,
                styles.linkInput,
                linkError ? styles.inputError : null,
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paste YouTube link"
              disabled={pasteLoading}
              style={[
                styles.pasteButton,
                pasteLoading && styles.pasteButtonDisabled,
              ]}
              onPress={handlePasteLink}
            >
              {pasteLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="clipboard-outline"
                  size={18}
                  color={colors.primary}
                />
              )}
              <Text style={styles.pasteButtonText}>Paste</Text>
            </Pressable>
          </View>
          {linkError ? <Text style={styles.errorText}>{linkError}</Text> : null}

          {(thumbnail || metaLoading) && (
            <View style={styles.previewWrap}>
              <Text style={styles.label}>Lesson Preview</Text>
              <View style={styles.previewCard}>
                {thumbnail ? (
                  <View style={styles.previewImageWrap}>
                    <Image
                      source={{ uri: thumbnail }}
                      style={styles.previewThumbnail}
                    />
                    <View style={styles.playIcon}>
                      <Ionicons name="play" size={26} color={colors.white} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.previewThumbPlaceholder}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
                {duration ? (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{duration}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Lesson title"
            style={styles.input}
          />

          <Text style={styles.label}>Subject</Text>
          <View style={styles.subjectRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select subject"
              style={styles.dropdown}
              onPress={() => setDropdownVisible(true)}
            >
              <View style={styles.dropdownContent}>
                <Ionicons
                  name="book-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.dropdownText}>
                  {subject || "Select subject"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Subject"
              disabled={!canAddSubject}
              style={[
                styles.multipleSubjectsButton,
                !canAddSubject && styles.multipleSubjectsButtonDisabled,
              ]}
              onPress={() => {
                if (!canAddSubject) return;
                setSelectedSubjects((current) => [...current, subject]);
                setSubject("");
              }}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.multipleSubjectsButtonText}>Add Subject</Text>
            </Pressable>
          </View>
          {selectedSubjects.length > 0 && (
            <View style={styles.subjectChips}>
              {selectedSubjects.map((selectedSubject) => (
                <Pressable
                  key={selectedSubject}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${selectedSubject}`}
                  style={styles.subjectChip}
                  onPress={() =>
                    setSelectedSubjects((current) =>
                      current.filter((item) => item !== selectedSubject),
                    )
                  }
                >
                  <Text style={styles.subjectChipText}>{selectedSubject}</Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Teacher</Text>
          <View style={styles.teacherChip}>
            {teacherAvatar ? (
              <Image
                source={{ uri: teacherAvatar }}
                style={styles.teacherAvatar}
              />
            ) : (
              <View style={styles.teacherAvatarFallback}>
                <Text style={styles.teacherAvatarFallbackText}>
                  {teacherName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.teacherChipText}>{teacherName}</Text>
          </View>

          <View style={styles.notifySection}>
            <View style={styles.notifySectionContent}>
              <View>
                <Text style={styles.notifyLabel}>Notify Community</Text>
                <Text style={styles.notifyDescription}>
                  Send notifications to users about this lesson
                </Text>
              </View>
              <Pressable
                style={[
                  styles.toggleSwitch,
                  notifyUsers && styles.toggleSwitchActive,
                ]}
                onPress={() => setNotifyUsers(!notifyUsers)}
                accessibilityRole="switch"
                accessibilityLabel="Notify Community"
                accessibilityState={{ checked: notifyUsers }}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    notifyUsers && styles.toggleCircleActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.submitButton,
              (!title.trim() || !isValidYouTubeVideoUrl(link)) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !title.trim() || !isValidYouTubeVideoUrl(link)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Publish lesson</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select subject</Text>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.optionList}
              showsVerticalScrollIndicator
              bounces={false}
            >
              {subjects
                .filter(
                  (item) => item !== "All" && !selectedSubjects.includes(item),
                )
                .map((item) => {
                  const isSelected = subject === item;
                  const isHovered = hoveredSubject === item;

                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      onHoverIn={() => setHoveredSubject(item)}
                      onHoverOut={() =>
                        setHoveredSubject((current) =>
                          current === item ? null : current,
                        )
                      }
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                        isHovered && styles.optionRowHovered,
                      ]}
                      onPress={() => {
                        setSubject(isSelected ? "" : item);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  content: { paddingBottom: spacing.xxl },
  helperText: {
    color: colors.subtitle,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  label: {
    color: colors.subtitle,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
  },
  linkInputRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.sm,
  },
  linkInput: {
    flex: 1,
  },
  pasteButton: {
    alignItems: "center",
    borderColor: "rgba(37, 99, 235, 0.3)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minWidth: 76,
    paddingHorizontal: 10,
  },
  pasteButtonDisabled: {
    opacity: 0.6,
  },
  pasteButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  subjectRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  multipleSubjectsButton: {
    alignItems: "center",
    borderColor: "rgba(37, 99, 235, 0.3)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 49,
    paddingHorizontal: 10,
  },
  multipleSubjectsButtonDisabled: {
    opacity: 0.45,
  },
  multipleSubjectsButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  dropdownText: { color: colors.text, fontSize: 15 },
  subjectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  subjectChip: {
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "rgba(37, 99, 235, 0.25)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  subjectChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  teacherChip: {
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teacherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  teacherAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  teacherAvatarFallbackText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  teacherChipText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  previewWrap: {
    marginTop: spacing.md,
  },
  previewCard: {
    position: "relative",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  previewThumbnail: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    backgroundColor: "#E5E7EB",
  },
  previewImageWrap: {
    position: "relative",
  },
  playIcon: {
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.92)",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    left: "50%",
    marginLeft: -28,
    marginTop: -28,
    position: "absolute",
    top: "50%",
    width: 56,
  },
  previewThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    backgroundColor: "#F3F4F6",
  },
  durationBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(17, 24, 39, 0.72)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  durationText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notifySection: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  notifySectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifyLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  notifyDescription: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCE3ED",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleCircleActive: {
    backgroundColor: colors.white,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    maxHeight: "80%",
    maxWidth: 420,
    overflow: "hidden",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    width: "100%",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalScrollView: {
    maxHeight: "100%",
  },
  optionList: {
    gap: 8,
    paddingBottom: 4,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionRowHovered: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  optionRowSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});
