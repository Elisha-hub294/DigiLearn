import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, functions } from "../../firebaseConfig";
import WebProfilePictureCropper from "../components/profile/WebProfilePictureCropper";
import { ActionDialog } from "../components/ui/ActionDialog";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { getThemeAsset } from "../constants/themeAssets";
import { useProfile } from "../contexts/ProfileContext";
import { useTheme } from "../contexts/ThemeContext";
import { clearGuestMode } from "../services/guestService";
import { saveProfilePicture } from "../services/userProfile";
import {
  normalizeProfileText,
  validateProfileText,
} from "../utils/profileValidation";

type Field = "name" | "bio" | "level" | "school" | "gender";
type RowProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress: () => void;
  about?: boolean;
};

const MAX_BIO_LENGTH = 300;

const fieldLabels: Record<Field, string> = {
  name: "Name",
  bio: "About",
  level: "Level",
  school: "School",
  gender: "Gender",
};

function ProfileSettingRow({ icon, label, value, onPress, about }: RowProps) {
  const { colors: themeColors } = useTheme();
  const hasValue = Boolean(value?.trim());
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.row}>
      <View style={styles.iconArea}>
        <Feather name={icon} size={23} color={themeColors.inactive} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: themeColors.text }]}>
          {label}
        </Text>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${hasValue ? "Edit" : "Set"} ${label}`}
        >
          <Text
            style={[styles.rowValue, !hasValue && styles.setAction]}
            numberOfLines={about && expanded ? undefined : 2}
          >
            {hasValue ? value : `Set ${label}`}
          </Text>
        </Pressable>
        {about && hasValue && !expanded && (value?.length ?? 0) > 95 ? (
          <Pressable
            onPress={() => setExpanded(true)}
            accessibilityLabel="See all about text"
          >
            <Text style={styles.seeMore}>...See more</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const friendlyError = (error: unknown) => {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "";
  if (code.includes("requires-recent-login"))
    return "For your security, please log in again before deleting your account.";
  if (code.includes("network"))
    return "Couldn't connect. Check your internet connection and try again.";
  if (code.includes("permission"))
    return "You don't have permission to update this profile.";
  return "We couldn't save your changes. Please try again.";
};

const profilePictureError = (error: unknown) => {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code).toLowerCase()
      : "";
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (
    code.includes("permission") ||
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("access")
  ) {
    return "Photo access is required to choose a profile picture. Allow access in your device settings and try again.";
  }
  if (code.includes("network") || normalizedMessage.includes("connect")) {
    return "We couldn't upload your picture because of a connection problem. Check your internet and try again.";
  }
  if (code.includes("unauthorized") || code.includes("unauthenticated")) {
    return "Your session has expired. Please log in again before changing your profile picture.";
  }
  if (
    normalizedMessage.includes("5 mb") ||
    normalizedMessage.includes("jpeg")
  ) {
    return message;
  }
  return "We couldn't upload your profile picture. Check your connection and try again.";
};

export default function MyProfileScreen() {
  const { colors: themeColors, isDark } = useTheme();
  const defaultUserAvatar = getThemeAsset("userDefault", isDark);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, loading } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [field, setField] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updateErrorMessage, setUpdateErrorMessage] = useState("");
  const [pictureSaving, setPictureSaving] = useState(false);
  const [pictureError, setPictureError] = useState("");
  const [pendingPicture, setPendingPicture] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);
  const openEditor = (nextField: Field) => {
    setField(nextField);
    setDraft(String(profile?.[nextField] ?? ""));
    setError("");
  };
  const save = async () => {
    if (!field || !user || saving) return;
    const value =
      field === "name" || field === "school" || field === "bio"
        ? normalizeProfileText(draft)
        : draft.trim();
    const original = String(profile?.[field] ?? "").trim();
    if (value === original) {
      setField(null);
      return;
    }
    if (field === "name" && !value) {
      setError("Please enter a value before continuing.");
      return;
    }
    if (
      (field === "name" || field === "school" || field === "bio") &&
      draft.trim() &&
      !value
    ) {
      setError(
        `${fieldLabels[field]} must contain at least one letter or number.`,
      );
      return;
    }
    if (field === "name" || field === "school" || field === "bio") {
      const validationError = validateProfileText(value, fieldLabels[field]);
      if (validationError && (field === "name" || draft.trim())) {
        setError(validationError);
        return;
      }
    }
    if (field === "bio" && value.length > MAX_BIO_LENGTH) {
      setError(
        `Bio must be ${MAX_BIO_LENGTH} characters or less (${value.length}/${MAX_BIO_LENGTH}).`,
      );
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", user.uid), { [field]: value });
      setField(null);
    } catch (reason) {
      setUpdateErrorMessage(friendlyError(reason));
    } finally {
      setSaving(false);
    }
  };
  const confirmDelete = () => {
    setMenuOpen(false);
    setDeleteDialogVisible(true);
  };
  const uploadProfilePicture = async (uri: string, mimeType = "image/jpeg") => {
    if (!user || pictureSaving) return;

    setPendingPicture(null);
    try {
      setPictureSaving(true);
      await saveProfilePicture(
        user,
        uri,
        mimeType,
        undefined,
        profile?.type ?? "student",
      );
    } catch (reason) {
      setPictureError(profilePictureError(reason));
    } finally {
      setPictureSaving(false);
    }
  };
  const changeProfilePicture = async () => {
    if (!user || pictureSaving) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: Platform.OS !== "web",
        aspect: [1, 1],
        shape: "rectangle",
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      if (Platform.OS === "web") {
        setPendingPicture(result.assets[0].uri);
        return;
      }

      await uploadProfilePicture(
        result.assets[0].uri,
        result.assets[0].mimeType,
      );
    } catch (reason) {
      setPictureError(profilePictureError(reason));
    }
  };
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ActionDialog
        visible={Boolean(updateErrorMessage)}
        title="Update unavailable"
        message={updateErrorMessage || "Please try again."}
        primaryText="OK"
        onPrimary={() => setUpdateErrorMessage("")}
        onClose={() => setUpdateErrorMessage("")}
      />
      <ActionDialog
        visible={Boolean(pictureError)}
        icon={<Feather name="alert-circle" size={24} color="#DC2626" />}
        title="Profile picture not updated"
        message={pictureError}
        primaryText="OK"
        onPrimary={() => setPictureError("")}
        onClose={() => setPictureError("")}
      />
      <WebProfilePictureCropper
        visible={pendingPicture !== null}
        image={pendingPicture}
        onCancel={() => setPendingPicture(null)}
        onConfirm={(croppedImage) => uploadProfilePicture(croppedImage)}
      />
      <ActionDialog
        visible={deleteDialogVisible}
        title="Delete account?"
        message="This permanently deletes your account. This action cannot be undone."
        primaryText="Delete Account"
        secondaryText="Cancel"
        primaryButtonColor="#DC2626"
        onPrimary={async () => {
          setDeleteDialogVisible(false);
          if (!auth.currentUser) return;
          try {
            await clearGuestMode();
            const deleteAccount = httpsCallable(functions, "deleteAccount");
            await deleteAccount({});
            router.replace("/welcome" as never);
          } catch (reason) {
            setUpdateErrorMessage(
              `Account not deleted: ${friendlyError(reason)}`,
            );
          }
        }}
        onSecondary={() => setDeleteDialogVisible(false)}
        onClose={() => setDeleteDialogVisible(false)}
      />
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingHorizontal: horizontalPadding },
            ]}
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Pressable
                  onPress={() => router.push("/settings" as never)}
                  style={styles.backButton}
                  accessibilityLabel="Back to settings"
                >
                  <Feather name="arrow-left" size={22} color={colors.dark} />
                </Pressable>
                <Text style={[styles.title, { color: themeColors.dark }]}>
                  My Profile
                </Text>
              </View>
              <Pressable
                onPress={() => setMenuOpen((v) => !v)}
                style={styles.headerButton}
                accessibilityLabel="Profile actions"
              >
                <Feather name="more-horizontal" size={25} color={colors.dark} />
              </Pressable>
            </View>
            {menuOpen ? (
              <>
                <Pressable
                  style={styles.overlay}
                  onPress={() => setMenuOpen(false)}
                  accessibilityLabel="Dismiss menu"
                />
                <View
                  style={[styles.menu, { backgroundColor: themeColors.white }]}
                >
                  <Pressable
                    onPress={confirmDelete}
                    style={styles.menuItem}
                    accessibilityRole="button"
                  >
                    <Text style={styles.deleteText}>Delete account</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
            {loading ? (
              <View style={styles.loading}>
                <View style={styles.avatarSkeleton} />
                <View style={styles.lineSkeleton} />
                <View style={styles.lineSkeleton} />
              </View>
            ) : !user ? (
              <View style={styles.authPrompt}>
                <Feather name="user" size={32} color={colors.primary} />
                <Text style={[styles.authTitle, { color: themeColors.dark }]}>
                  Log in or Sign up
                </Text>
                <Text
                  style={[styles.authCopy, { color: themeColors.subtitle }]}
                >
                  Sign in or create an account to manage your profile
                  information.
                </Text>
                <View style={styles.authActions}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/login",
                        params: { from: "my-profile" },
                      } as never)
                    }
                    style={styles.login}
                  >
                    <Text style={styles.loginText}>Log in</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/signup" as never)}
                    style={styles.signup}
                  >
                    <Text style={styles.signupText}>Sign up</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Image
                  source={
                    user.photoURL ? { uri: user.photoURL } : defaultUserAvatar
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                  accessibilityLabel="Your profile picture"
                />
                <Pressable
                  onPress={changeProfilePicture}
                  disabled={pictureSaving}
                  style={styles.changePictureButton}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile picture"
                >
                  {pictureSaving ? (
                    <ActivityIndicator color="#3B82F6" size="small" />
                  ) : (
                    <Feather name="camera" size={16} color="#3B82F6" />
                  )}
                  <Text style={styles.changePictureText}>
                    {pictureSaving
                      ? "Saving profile picture..."
                      : "Change profile picture"}
                  </Text>
                </Pressable>
                <View style={styles.rows}>
                  <ProfileSettingRow
                    icon="user"
                    label="Name"
                    value={profile?.name}
                    onPress={() => openEditor("name")}
                  />
                  <ProfileSettingRow
                    icon="info"
                    label="About"
                    value={profile?.bio}
                    onPress={() => openEditor("bio")}
                    about
                  />
                  <ProfileSettingRow
                    icon="award"
                    label="Level"
                    value={profile?.level}
                    onPress={() => openEditor("level")}
                  />
                  <ProfileSettingRow
                    icon="book-open"
                    label="School"
                    value={profile?.school}
                    onPress={() => openEditor("school")}
                  />
                  <ProfileSettingRow
                    icon="users"
                    label="Gender"
                    value={profile?.gender}
                    onPress={() => openEditor("gender")}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
      <Modal
        visible={field !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setField(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.sheet, { backgroundColor: themeColors.white }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: themeColors.dark }]}>
              Set {field ? fieldLabels[field] : ""}
            </Text>
            {field === "level" ? (
              <View style={styles.choices}>
                {["Ordinary", "Advanced"].map((choice) => (
                  <Pressable
                    key={choice}
                    onPress={() => setDraft(choice)}
                    style={[
                      styles.choice,
                      draft === choice && styles.choiceSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        draft === choice && styles.choiceTextSelected,
                      ]}
                    >
                      {choice}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : field === "gender" ? (
              <View style={styles.choices}>
                {["Male", "Female"].map((choice) => (
                  <Pressable
                    key={choice}
                    onPress={() => setDraft(choice)}
                    style={[
                      styles.choice,
                      draft === choice && styles.choiceSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Set gender to ${choice}`}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        draft === choice && styles.choiceTextSelected,
                      ]}
                    >
                      {choice}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  autoFocus
                  placeholder={
                    field === "bio"
                      ? "Tell us about yourself..."
                      : `Enter your ${field ?? "value"}`
                  }
                  placeholderTextColor="#9CA3AF"
                  multiline={field === "bio"}
                  maxLength={field === "bio" ? MAX_BIO_LENGTH : undefined}
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                    field === "bio" && styles.bioInput,
                  ]}
                  accessibilityLabel={`Enter ${field ? fieldLabels[field] : "value"}`}
                />
                {field === "bio" ? (
                  <Text style={styles.charCounter}>
                    {draft.length}/{MAX_BIO_LENGTH}
                  </Text>
                ) : null}
              </>
            )}
            {error ? <Text style={styles.validation}>{error}</Text> : null}
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setField(null)} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                style={styles.confirm}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  scroll: { flex: 1, width: "100%" },
  container: { paddingTop: spacing.xxl, paddingBottom: 48 },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  menu: {
    position: "absolute",
    right: 0,
    top: 58,
    zIndex: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  menuItem: {
    minWidth: 150,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  deleteText: { color: "#FF3B30", fontWeight: "600" },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 28,
    backgroundColor: "#EEF2F7",
  },
  changePictureButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  changePictureText: { color: "#3B82F6", fontSize: 14, fontWeight: "700" },
  rows: { marginTop: 40, gap: 30 },
  row: { flexDirection: "row", minHeight: 60 },
  iconArea: { width: 48, paddingTop: 2, alignItems: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 5 },
  rowValue: { fontSize: 15, color: "#6B6B6B", lineHeight: 21 },
  setAction: { color: "#3B82F6", fontWeight: "600" },
  seeMore: { color: "#3B82F6", fontSize: 14, fontWeight: "600", marginTop: 3 },
  loading: { alignItems: "center", gap: 28, marginTop: 28 },
  avatarSkeleton: {
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "#EDF2F8",
  },
  lineSkeleton: {
    height: 54,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#EDF2F8",
  },
  authPrompt: { paddingTop: 86, alignItems: "center" },
  authTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginTop: 14 },
  authCopy: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B6B",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 330,
  },
  authActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  login: {
    minHeight: 44,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  loginText: { color: "#3B82F6", fontWeight: "700" },
  signup: {
    minHeight: 44,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#3B82F6",
  },
  signupText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    color: "#111",
    fontSize: 16,
  },
  bioInput: { minHeight: 110, paddingTop: 13, textAlignVertical: "top" },
  charCounter: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "right",
  },
  choices: { gap: 10 },
  choice: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  choiceSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  choiceText: { color: "#111", fontSize: 16 },
  choiceTextSelected: { color: "#3B82F6", fontWeight: "700" },
  validation: { color: "#FF3B30", fontSize: 13, marginTop: 8 },
  sheetActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },
  cancel: {
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { color: "#6B6B6B", fontWeight: "600" },
  confirm: {
    minWidth: 100,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "700" },
});
