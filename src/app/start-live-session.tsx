import { Feather as Icon } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { AdminPublishHeader } from "../components/library/AdminPublishHeader";
import { PublishAccessGate } from "../components/library/PublishAccessGate";
import { getTitleDocId } from "../components/library/add-item/utils";
import { useSubjects } from "../components/ui/SubjectFilter";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { useTheme } from "../contexts/ThemeContext";
import { invalidateFirestoreReadCache } from "../services/firestoreReadCache";
import {
  openGoogleMeetSession,
  validateGoogleMeetInput,
} from "../utils/googleMeet";
import { invalidateLocalCaches, LOCAL_CACHE_KEYS } from "../utils/localCache";
import { showNativeToast } from "../utils/nativeToast";

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

export default function StartLiveSessionScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { colors: themeColors, isDark } = useTheme();
  const { subjects } = useSubjects();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(840, width - horizontalPadding * 2);

  const isAuthorizedPublisher =
    profile?.type === "admin" ||
    (profile?.type === "teacher" &&
      profile.teacherApprovalStatus === "approved");

  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(
    profile?.subjects?.[0] || "Mathematics",
  );
  const [meetInput, setMeetInput] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [testingLink, setTestingLink] = useState(false);

  const validation = useMemo(
    () => validateGoogleMeetInput(meetInput),
    [meetInput],
  );

  const teacherName =
    profile?.name || auth.currentUser?.displayName || "Teacher";

  const handlePaste = async () => {
    try {
      setPasteLoading(true);
      const text = await Clipboard.getStringAsync();
      if (text) {
        setMeetInput(text.trim());
      }
    } catch {
      showNativeToast("Unable to read clipboard");
    } finally {
      setPasteLoading(false);
    }
  };

  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setCoverImage(result.assets[0].uri);
      }
    } catch {
      showNativeToast("Could not pick image");
    }
  };

  const handleTestLink = async () => {
    if (!validation.url) return;
    setTestingLink(true);
    try {
      await openGoogleMeetSession(validation.url);
    } finally {
      setTestingLink(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showNativeToast("Please enter a title for your live session.");
      return;
    }

    if (!validation.isValid || !validation.code || !validation.url) {
      showNativeToast(
        validation.error || "Please enter a valid Google Meet code or link.",
      );
      return;
    }

    if (!auth.currentUser) {
      showNativeToast("You must be logged in to start a session.");
      return;
    }

    setSubmitting(true);
    try {
      const bannerId = `live-${getTitleDocId(title)}-${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      await setDoc(doc(db, "teacherPosts", bannerId), {
        title: title.trim(),
        description: description.trim(),
        descriprion: description.trim(), // backward-compatibility alias
        subject: selectedSubject || "General",
        hasCover: true,
        cover: coverImage || DEFAULT_COVER,
        images: coverImage ? [coverImage] : [DEFAULT_COVER],
        document: "",
        fileType: "image",
        createdAt: serverTimestamp(),
        owner: auth.currentUser.uid,
        ownerType: profile?.type || "teacher",
        teacher: teacherName,
        postType: "live",
        type: "live",
        meetCode: validation.code,
        meetUrl: validation.url,
        isLive: true,
        status: "live",
        notifyFollowers,
      });

      await invalidateLocalCaches(LOCAL_CACHE_KEYS.library);
      invalidateFirestoreReadCache(
        "collection:teacherPosts",
        "collection:promotionalBanner",
      );

      showNativeToast("Live session started! Students can now join.");
      router.replace("/");
    } catch (err) {
      console.error("Failed to start live session:", err);
      showNativeToast("Failed to start live session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublishAccessGate
      isAuthorizedPublisher={isAuthorizedPublisher}
      title="Start Live Session"
      unauthorizedMessage="Only approved teacher accounts can host live sessions. Please request teacher approval to continue."
      onBack={() => router.back()}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
          <AdminPublishHeader
            title="Start Live Session"
            onBack={() => router.back()}
            disabled={submitting}
          />

          {/* Intro Hero Card */}
          <LinearGradient
            colors={["#102F70", "#1E52B7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIconWrap}>
              <Icon name="video" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroLivePill}>
                  <View style={styles.heroLiveDot} />
                  <Text style={styles.heroLiveText}>GOOGLE MEET</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Host a Live Learning Session</Text>
              <Text style={styles.heroSubtitle}>
                Add your Google Meet invitation code so learners can tap & join
                directly from their feed.
              </Text>
            </View>
          </LinearGradient>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: themeColors.white,
                borderColor: themeColors.border,
              },
            ]}
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  Session Title <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text
                  style={[styles.charCounter, { color: themeColors.subtitle }]}
                >
                  {title.length}/{TITLE_MAX_LENGTH}
                </Text>
              </View>
              <TextInput
                value={title}
                onChangeText={(text) =>
                  setTitle(text.slice(0, TITLE_MAX_LENGTH))
                }
                placeholder="e.g. S.4 Physics - Electricity & Magnetism Revision"
                placeholderTextColor={themeColors.inactive}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: themeColors.lightBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                editable={!submitting}
              />
            </View>

            {/* Subject Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Subject <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectChipsList}
              >
                {subjects
                  .filter((sub) => sub.toLowerCase() !== "all")
                  .map((subName) => {
                    const isSelected = selectedSubject === subName;
                    return (
                      <Pressable
                        key={subName}
                        onPress={() => setSelectedSubject(subName)}
                        disabled={submitting}
                        style={[
                          styles.subjectChip,
                          {
                            backgroundColor: isSelected
                              ? themeColors.primary
                              : themeColors.lightBackground,
                            borderColor: isSelected
                              ? themeColors.primary
                              : themeColors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subjectChipText,
                            {
                              color: isSelected ? "#FFFFFF" : themeColors.text,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {subName}
                        </Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>

            {/* Google Meet Coordinates Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  Google Meet Code or Link{" "}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Pressable
                  onPress={handlePaste}
                  disabled={pasteLoading || submitting}
                  style={styles.pasteButton}
                >
                  {pasteLoading ? (
                    <ActivityIndicator size="small" color={themeColors.primary} />
                  ) : (
                    <>
                      <Icon
                        name="clipboard"
                        size={14}
                        color={themeColors.primary}
                      />
                      <Text
                        style={[
                          styles.pasteButtonText,
                          { color: themeColors.primary },
                        ]}
                      >
                        Paste
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
              <Text
                style={[styles.fieldHelper, { color: themeColors.subtitle }]}
              >
                Enter your meeting code (e.g. abc-defg-hij) or paste the Google
                Meet link.
              </Text>
              <TextInput
                value={meetInput}
                onChangeText={setMeetInput}
                placeholder="e.g. abc-defg-hij or https://meet.google.com/abc-defg-hij"
                placeholderTextColor={themeColors.inactive}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: themeColors.lightBackground,
                    color: themeColors.text,
                    borderColor:
                      meetInput.trim() && !validation.isValid
                        ? colors.danger
                        : themeColors.border,
                  },
                ]}
                editable={!submitting}
              />

              {/* Validation Status & Live Preview */}
              {meetInput.trim().length > 0 && (
                <View style={styles.validationFeedbackWrap}>
                  {validation.isValid && validation.code ? (
                    <View
                      style={[
                        styles.validPreviewCard,
                        {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.12)"
                            : "#ECFDF5",
                          borderColor: isDark ? "#065F46" : "#A7F3D0",
                        },
                      ]}
                    >
                      <View style={styles.validHeaderRow}>
                        <View style={styles.validStatusRow}>
                          <Icon name="check-circle" size={16} color="#10B981" />
                          <Text style={styles.validCodeTitle}>
                            Meeting Code:{" "}
                            <Text style={styles.validCodeValue}>
                              {validation.code}
                            </Text>
                          </Text>
                        </View>
                        <Pressable
                          onPress={handleTestLink}
                          disabled={testingLink || submitting}
                          style={styles.testLinkButton}
                        >
                          {testingLink ? (
                            <ActivityIndicator size="small" color="#10B981" />
                          ) : (
                            <>
                              <Icon
                                name="external-link"
                                size={12}
                                color="#047857"
                              />
                              <Text style={styles.testLinkText}>Test room</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                      <Text style={styles.validUrlText} numberOfLines={1}>
                        {validation.url}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.invalidRow}>
                      <Icon
                        name="alert-circle"
                        size={14}
                        color={colors.danger}
                      />
                      <Text
                        style={[
                          styles.invalidText,
                          { color: colors.danger },
                        ]}
                      >
                        {validation.error}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Agenda / Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  Session Agenda / Description (Optional)
                </Text>
                <Text
                  style={[styles.charCounter, { color: themeColors.subtitle }]}
                >
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </Text>
              </View>
              <TextInput
                value={description}
                onChangeText={(text) =>
                  setDescription(text.slice(0, DESCRIPTION_MAX_LENGTH))
                }
                placeholder="What topics will you discuss? Mention any notes or calculators students should bring."
                placeholderTextColor={themeColors.inactive}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: themeColors.lightBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                editable={!submitting}
              />
            </View>

            {/* Optional Cover Banner */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Room Cover Image (Optional)
              </Text>
              <Text
                style={[styles.fieldHelper, { color: themeColors.subtitle }]}
              >
                A high-resolution visual backdrop displayed on the live session
                card.
              </Text>
              <Pressable
                onPress={handlePickCover}
                disabled={submitting}
                style={[
                  styles.coverPicker,
                  {
                    backgroundColor: themeColors.lightBackground,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                {coverImage ? (
                  <View style={styles.coverImageWrap}>
                    <Image
                      source={{ uri: coverImage }}
                      style={styles.coverImagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.changeCoverBadge}>
                      <Icon name="camera" size={12} color="#FFFFFF" />
                      <Text style={styles.changeCoverText}>Change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Icon
                      name="image"
                      size={24}
                      color={themeColors.subtitle}
                    />
                    <Text
                      style={[
                        styles.coverPlaceholderText,
                        { color: themeColors.subtitle },
                      ]}
                    >
                      Tap to choose a custom cover image, or use the default live
                      theme
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Notify Followers Toggle */}
            <Pressable
              onPress={() => setNotifyFollowers((prev) => !prev)}
              disabled={submitting}
              style={[
                styles.notifyRow,
                {
                  backgroundColor: themeColors.lightBackground,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.notifyCopy}>
                <Text style={[styles.notifyTitle, { color: themeColors.text }]}>
                  Notify your student community
                </Text>
                <Text
                  style={[
                    styles.notifySubtitle,
                    { color: themeColors.subtitle },
                  ]}
                >
                  Send an instant alert to followers so they can join right away
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: notifyFollowers
                      ? themeColors.primary
                      : "transparent",
                    borderColor: notifyFollowers
                      ? themeColors.primary
                      : themeColors.border,
                  },
                ]}
              >
                {notifyFollowers && (
                  <Icon name="check" size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            {/* Submit Action */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && { opacity: 0.9 },
                submitting && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={["#EA4335", "#C5221F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="radio" size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      Go Live & Publish Session
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </PublishAccessGate>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  container: {
    width: "100%",
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  heroLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    gap: 5,
  },
  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  heroLiveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#D9E7FF",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  formCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  requiredAsterisk: {
    color: colors.danger,
  },
  charCounter: {
    fontSize: 12,
  },
  fieldHelper: {
    fontSize: 12,
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  pasteButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  subjectChipsList: {
    gap: 8,
    paddingVertical: 4,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 13,
  },
  validationFeedbackWrap: {
    marginTop: 4,
  },
  validPreviewCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  validHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  validCodeTitle: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "600",
  },
  validCodeValue: {
    fontWeight: "800",
    color: "#047857",
  },
  validUrlText: {
    fontSize: 12,
    color: "#059669",
  },
  testLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  testLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  invalidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  invalidText: {
    fontSize: 12,
  },
  coverPicker: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xs,
  },
  coverPlaceholderText: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
  },
  coverImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
  },
  coverImagePreview: {
    width: "100%",
    height: "100%",
  },
  changeCoverBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  changeCoverText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  notifyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  notifyCopy: {
    flex: 1,
  },
  notifyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  notifySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
