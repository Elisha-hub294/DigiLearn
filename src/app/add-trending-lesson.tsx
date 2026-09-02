import { extractYoutubeId, getVideoThumbnailUrl } from "@/utils/videoUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
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
import { auth, db } from "../../firebaseConfig";
import { AdminPublishHeader } from "../components/library/AdminPublishHeader";
import { useSubjects } from "../components/ui/SubjectFilter";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../services/notifications";

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

async function fetchYoutubeVideoMeta(videoUrl: string) {
  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) {
    return { title: "", duration: "", thumbnail: "" };
  }

  const apiKey =
    process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    "";

  try {
    if (apiKey) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`,
      );
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        const title = item?.snippet?.title || "";
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
              duration: formatDurationFromSeconds(totalSeconds),
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            };
          }
        }

        if (title) {
          return {
            title,
            duration: "",
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
      }
    }

    const infoResponse = await fetch(
      `https://www.youtube.com/get_video_info?video_id=${videoId}&el=detailpage&hl=en`,
    );

    if (!infoResponse.ok) {
      return {
        title: "",
        duration: "",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    const infoText = await infoResponse.text();
    const params = new URLSearchParams(infoText);
    const playerResponse = params.get("player_response");

    if (playerResponse) {
      const parsed = JSON.parse(decodeURIComponent(playerResponse));
      const videoDetails = parsed.videoDetails || parsed;
      const title = videoDetails.title || "";
      const lengthSeconds = Number(videoDetails.lengthSeconds || 0);
      const thumbnails = videoDetails.thumbnail?.thumbnails || [];
      const bestThumb =
        thumbnails[thumbnails.length - 1]?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        title,
        duration: formatDurationFromSeconds(lengthSeconds),
        thumbnail: bestThumb,
      };
    }

    return {
      title: "",
      duration: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube metadata:", error);
    return {
      title: "",
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
  const [subject, setSubject] = useState("Mathematics");
  const [link, setLink] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState(true);

  const teacherName =
    profile?.name || auth.currentUser?.displayName || "Teacher";

  const teacherAvatar =
    profile?.photoURL && profile.photoURL.trim()
      ? profile.photoURL
      : auth.currentUser?.photoURL && auth.currentUser.photoURL.trim()
        ? auth.currentUser.photoURL
        : "";

  const handleLinkChange = async (value: string) => {
    setLink(value);

    if (!value.trim()) {
      setLinkError("");
      setDuration("");
      setThumbnail("");
      setTitle("");
      return;
    }

    if (!isValidYouTubeVideoUrl(value)) {
      setLinkError("Only YouTube video links are allowed.");
      setDuration("");
      setThumbnail("");
      setTitle("");
      setMetaLoading(false);
      return;
    }

    setLinkError("");
    setMetaLoading(true);
    try {
      const meta = await fetchYoutubeVideoMeta(value.trim());
      setDuration(meta.duration || "");
      setThumbnail(meta.thumbnail || "");
      if (meta.title && !title.trim()) {
        setTitle(meta.title);
      }
    } catch {
      setDuration("");
      setThumbnail("");
      setTitle("");
    } finally {
      setMetaLoading(false);
    }
  };

  async function handleSubmit() {
    if (!title.trim() || !isValidYouTubeVideoUrl(link)) {
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

      const lessonRef = await addDoc(collection(db, "trendingLessons"), {
        id: "",
        title: title.trim(),
        subject: subject === "All" ? "General" : subject,
        teacher: teacherValue,
        uploadedAt: serverTimestamp(),
        duration: finalDuration,
        thumbnail: finalThumbnail,
        link: link.trim(),
        avatar: avatarValue,
      });

      await setDoc(doc(db, "trendingLessons", lessonRef.id), {
        id: lessonRef.id,
        title: title.trim(),
        subject: subject === "All" ? "General" : subject,
        teacher: teacherValue,
        uploadedAt: serverTimestamp(),
        duration: finalDuration,
        thumbnail: finalThumbnail,
        link: link.trim(),
        avatar: avatarValue,
      });

      if (notifyUsers) {
        await appendNotificationToAllUsers(
          buildLibraryNotification(
            "lesson",
            lessonRef.id,
            undefined,
            undefined,
            title.trim(),
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
        <AdminPublishHeader
          title="Add Trending Lesson"
          onBack={() => router.back()}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.helperText}>
            Paste a YouTube link to auto-fill the lesson details.
          </Text>

          <Text style={styles.label}>YouTube Link</Text>
          <TextInput
            value={link}
            onChangeText={handleLinkChange}
            placeholder="https://www.youtube.com/watch?v=..."
            style={[styles.input, linkError ? styles.inputError : null]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
          />
          {linkError ? <Text style={styles.errorText}>{linkError}</Text> : null}

          {(thumbnail || metaLoading) && (
            <View style={styles.previewWrap}>
              <Text style={styles.label}>Lesson Preview</Text>
              <View style={styles.previewCard}>
                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.previewThumbnail}
                  />
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
            onChangeText={setTitle}
            placeholder="Lesson title"
            style={styles.input}
          />

          <Text style={styles.label}>Subject</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.dropdownText}>{subject}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </Pressable>

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
          <ScrollView style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose subject</Text>
            {subjects
              .filter((item) => item !== "All")
              .map((item) => (
                <Pressable
                  key={item}
                  style={styles.optionRow}
                  onPress={() => {
                    setSubject(item);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {subject === item ? (
                    <Ionicons name="checkmark" size={18} color="#2563EB" />
                  ) : null}
                </Pressable>
              ))}
          </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: { color: colors.text, fontSize: 15 },
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  modalTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  optionText: { color: "#111", fontSize: 15 },
});
