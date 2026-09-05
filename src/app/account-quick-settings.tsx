import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { auth, db } from "../../firebaseConfig";
import { NotifyToggle } from "../components/library/add-item/SharedFormControls";
import { ActionDialog } from "../components/ui/ActionDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { SubjectChip } from "../components/ui/SubjectChip";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import {
  normalizeProfileText,
  validateProfileText,
} from "../utils/profileValidation";

type Subject = { id: string; name: string };

const LEVEL_OPTIONS = ["Ordinary level", "Advanced level"];

function getSubjectNames(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const clean = normalizeProfileText(typeof item === "string" ? item : "");
    const key = clean.toLocaleLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  });

  return result;
}

function InfoMessage({ children }: { children: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name="info" size={12} color="#FF6B6B" />
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

export default function AccountQuickSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [school, setSchool] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [filterFeedByInterests, setFilterFeedByInterests] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showContinueDialog, setShowContinueDialog] = useState(false);

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(520, width - horizontalPadding * 2);

  const loadData = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setLoadError("");
    setSaveError("");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const [userSnapshot, subjectSnapshot] = await Promise.all([
        getDoc(userRef),
        getDocs(collection(db, "subject")),
      ]);

      const profile = userSnapshot.data() ?? {};
      const nextSubjects = subjectSnapshot.docs.reduce<Subject[]>(
        (result, item) => {
          const rawName =
            typeof item.data().name === "string" ? item.data().name : "";
          const name = normalizeProfileText(rawName);
          const key = name.toLocaleLowerCase();
          if (
            name &&
            !result.some((subject) => subject.name.toLocaleLowerCase() === key)
          ) {
            result.push({ id: item.id, name });
          }
          return result;
        },
        [],
      );

      const userName = normalizeProfileText(
        typeof profile.name === "string"
          ? profile.name
          : (currentUser.displayName ?? ""),
      );
      const fallbackName = normalizeProfileText(currentUser.displayName ?? "");
      const initialName = userName || fallbackName;
      const initialLevel =
        typeof profile.level === "string" ? profile.level : "";
      const initialSchool = normalizeProfileText(
        typeof profile.school === "string" ? profile.school : "",
      );
      const initialSelectedSubjects = getSubjectNames(
        profile.subjects ?? [],
      ).map((subject) => normalizeProfileText(subject));
      const initialFilter = Boolean(profile.filterFeedByInterests);

      setName(initialName);
      setLevel(initialLevel);
      setSchool(initialSchool);
      setSubjects(nextSubjects);
      setSelectedSubjects(initialSelectedSubjects);
      setFilterFeedByInterests(initialFilter);
    } catch {
      setLoadError(
        "We couldn't load your profile details right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsLoading(false);
        return;
      }

      await loadData(nextUser);
    });

    return () => unsubscribe();
  }, [loadData]);

  const handleToggleSubject = useCallback((subjectName: string) => {
    setSelectedSubjects((current) => {
      const matches = (item: string) =>
        item.localeCompare(subjectName, undefined, {
          sensitivity: "accent",
        }) === 0;

      return current.some(matches)
        ? current.filter((item) => !matches(item))
        : [...current, subjectName];
    });
  }, []);

  const saveProfile = useCallback(async () => {
    if (!user || isSaving) {
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        type: "student",
        accountTypeCompleted: true,
      };

      const cleanName = normalizeProfileText(name);
      const cleanSchool = normalizeProfileText(school);

      if (cleanName) payload.name = cleanName;
      if (level) payload.level = level;
      if (cleanSchool) payload.school = cleanSchool;
      if (selectedSubjects.length > 0) payload.subjects = selectedSubjects;
      payload.filterFeedByInterests = filterFeedByInterests;

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      router.replace("/" as never);
    } catch {
      setSaveError(
        "Couldn't save your profile details. Please check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    filterFeedByInterests,
    isSaving,
    level,
    name,
    router,
    school,
    selectedSubjects,
    user,
  ]);

  const handleSave = useCallback(async () => {
    if (!user || isSaving) {
      return;
    }

    const cleanName = normalizeProfileText(name);
    const cleanSchool = normalizeProfileText(school);
    const nameError = name.trim() ? validateProfileText(cleanName, "Name") : "";
    const schoolError = school.trim()
      ? validateProfileText(cleanSchool, "School")
      : "";

    if (nameError || schoolError) {
      setSaveError(nameError || schoolError);
      return;
    }

    const hasAnyData =
      Boolean(cleanName) ||
      Boolean(level) ||
      Boolean(cleanSchool) ||
      selectedSubjects.length > 0;

    if (!hasAnyData) {
      setShowContinueDialog(true);
      return;
    }

    await saveProfile();
  }, [isSaving, level, name, saveProfile, school, selectedSubjects, user]);

  const handleLogin = useCallback(() => {
    router.replace("/login" as never);
  }, [router]);

  const handleSignup = useCallback(() => {
    router.replace("/signup" as never);
  }, [router]);

  const renderAuthState = () => (
    <View style={styles.authState}>
      <Text style={styles.authTitle}>You&apos;re not signed in</Text>
      <Text style={styles.authText}>
        Log in or create an account to finish setting up your DigiLearn profile.
      </Text>

      <View style={styles.authActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in"
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Log in</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign up"
          onPress={handleSignup}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!user && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.authContainer, { maxWidth: contentMaxWidth }]}>
            {renderAuthState()}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 40}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to account type"
                onPress={() => router.replace("/account-type" as never)}
                style={styles.backButton}
              >
                <Feather name="arrow-left" size={22} color={colors.dark} />
              </Pressable>

              <View style={styles.titleWrap}>
                <Text style={styles.title}>Student Account</Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
              <View style={styles.skeletonWrap}>
                <Skeleton style={styles.skeletonLine} />
                <Skeleton style={styles.skeletonLineShort} />
                <Skeleton style={styles.skeletonField} />
                <Skeleton style={styles.skeletonField} />
                <View style={styles.skeletonChips}>
                  {[0, 1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} style={styles.skeletonChip} />
                  ))}
                </View>
              </View>
            ) : loadError ? (
              <View style={styles.errorState}>
                <Text style={styles.errorTitle}>
                  We couldn’t load your profile.
                </Text>
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading account profile"
                  onPress={() => user && loadData(user)}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="#7A8FA8"
                    style={styles.input}
                    accessibilityLabel="Name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="name"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Level</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select level"
                    onPress={() => setShowLevelModal(true)}
                    style={styles.selectField}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !level && styles.placeholderText,
                      ]}
                    >
                      {level || "Select level"}
                    </Text>
                    <Feather name="chevron-down" size={18} color="#475569" />
                  </Pressable>

                  <InfoMessage>
                    Your level helps DigiLearn personalize the learning
                    resources and recommendations shown in your feed.
                  </InfoMessage>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>School (Optional)</Text>
                  <TextInput
                    value={school}
                    onChangeText={setSchool}
                    placeholder="Your school"
                    placeholderTextColor="#7A8FA8"
                    style={styles.input}
                    accessibilityLabel="School"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="organizationName"
                  />
                  <InfoMessage>
                    Adding your school helps us connect you with relevant
                    teachers, resources, and learning opportunities.
                  </InfoMessage>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Subjects</Text>
                  {subjects.length > 0 ? (
                    <View style={styles.chipsWrap}>
                      {subjects.map((subject) => {
                        const isSelected = selectedSubjects.some(
                          (item) =>
                            item.localeCompare(subject.name, undefined, {
                              sensitivity: "accent",
                            }) === 0,
                        );

                        return (
                          <SubjectChip
                            key={subject.id}
                            item={{
                              id: subject.id,
                              label: subject.name,
                              active: isSelected,
                            }}
                            onPress={() => handleToggleSubject(subject.name)}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptySubjects}>
                      No subjects are available yet.
                    </Text>
                  )}

                  <InfoMessage>
                    Your selected subjects can be changed anytime in
                    Preferences. They personalize your feed and help you
                    discover relevant learning resources.
                  </InfoMessage>
                </View>

                <View style={styles.toggleCard}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>
                      Only show selected interests in feeds
                    </Text>
                    <Text style={styles.toggleSubtitle}>
                      Filter your Home and Library feeds to only display
                      resources matching your selected subjects.
                    </Text>
                  </View>
                  <NotifyToggle
                    checked={filterFeedByInterests}
                    onToggle={() => setFilterFeedByInterests((value) => !value)}
                    accessibilityLabel="Toggle filter feeds by interests"
                  />
                </View>

                {saveError ? (
                  <Text style={styles.errorBubble}>{saveError}</Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirm account details"
                  disabled={isSaving}
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    isSaving && styles.primaryButtonDisabled,
                    pressed && !isSaving && styles.buttonPressed,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Confirm</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionDialog
        visible={showContinueDialog}
        title="Continue without details?"
        message="You can always add your name, level, school, and subjects later in your profile."
        primaryText="Continue"
        secondaryText="Cancel"
        onPrimary={() => {
          setShowContinueDialog(false);
          void saveProfile();
        }}
        onSecondary={() => setShowContinueDialog(false)}
        onClose={() => setShowContinueDialog(false)}
      />

      <Modal
        visible={showLevelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLevelModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLevelModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Select level</Text>
            {LEVEL_OPTIONS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option}`}
                onPress={() => {
                  setLevel(option);
                  setShowLevelModal(false);
                }}
                style={[
                  styles.modalOption,
                  level === option && styles.modalOptionSelected,
                ]}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
                {level === option ? (
                  <Feather name="check" size={16} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: 36,
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },
  authContainer: {
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "#E6F3FC",
    borderWidth: 1,
    borderColor: "#D9EAF8",
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  selectField: {
    backgroundColor: "#E6F3FC",
    borderWidth: 1,
    borderColor: "#D9EAF8",
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#7A8FA8",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    gap: 6,
    flexShrink: 1,
  },
  infoText: {
    flex: 1,
    color: "#FF6B6B",
    fontSize: 12.5,
    lineHeight: 17,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptySubjects: {
    color: "#475569",
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#55A9DF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    minWidth: 120,
    minHeight: 46,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  authState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.dark,
    textAlign: "center",
  },
  authText: {
    marginTop: spacing.md,
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 360,
  },
  authActions: {
    marginTop: spacing.xl,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  errorState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  errorTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBubble: {
    marginTop: spacing.md,
    backgroundColor: "#FFF1F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD9DE",
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalOptionSelected: {
    backgroundColor: "#F3F9FF",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  skeletonWrap: {
    gap: 12,
    paddingTop: spacing.md,
  },
  skeletonLine: {
    height: 18,
    width: "35%",
    borderRadius: 8,
  },
  skeletonLineShort: {
    height: 18,
    width: "52%",
    borderRadius: 8,
  },
  skeletonField: {
    height: 48,
    width: "100%",
    borderRadius: 10,
  },
  skeletonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skeletonChip: {
    width: 76,
    height: 34,
    borderRadius: 999,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: spacing.md,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
});
