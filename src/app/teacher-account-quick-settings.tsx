import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
import { SubjectChip } from "../components/ui/SubjectChip";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";

type Subject = { id: string; name: string };

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getSubjectNames(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const clean = normalizeText(typeof item === "string" ? item : "");
    const key = clean.toLocaleLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  });

  return result;
}

function InfoMessage({ children, color = "#3B82F6" }: { children: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name="info" size={12} color={color} />
      <Text style={[styles.infoText, { color }]}>{children}</Text>
    </View>
  );
}

export default function TeacherAccountQuickSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(500, width - horizontalPadding * 2);

  const loadData = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setLoadError("");
    setSaveError("");

    try {
      const userRef = doc(db, "teachers", currentUser.uid);
      const [userSnapshot, subjectSnapshot] = await Promise.all([
        getDoc(userRef),
        getDocs(collection(db, "subject")),
      ]);

      const profile = userSnapshot.data() ?? {};

      const nextSubjects = subjectSnapshot.docs.reduce<Subject[]>((result, item) => {
        const rawName = typeof item.data().name === "string" ? item.data().name : "";
        const nameText = normalizeText(rawName);
        const key = nameText.toLocaleLowerCase();
        if (nameText && !result.some((subject) => subject.name.toLocaleLowerCase() === key)) {
          result.push({ id: item.id, name: nameText });
        }
        return result;
      }, []);

      const initialName = normalizeText(
        typeof profile.name === "string" ? profile.name : currentUser.displayName ?? "",
      );
      const initialSchool = normalizeText(
        typeof profile.school === "string" ? profile.school : "",
      );
      const initialSelectedSubjects = getSubjectNames(profile.subjects ?? []);

      setName(initialName);
      setSchool(initialSchool);
      setSubjects(nextSubjects);
      setSelectedSubjects(initialSelectedSubjects);
    } catch {
      setLoadError("We couldn't load your teacher profile details right now. Please try again.");
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
        item.localeCompare(subjectName, undefined, { sensitivity: "accent" }) === 0;

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
      const payload = {
        name: normalizeText(name),
        school: normalizeText(school),
        subjects: selectedSubjects,
      };

      const userRef = doc(db, "teachers", user.uid);
      await setDoc(userRef, payload, { merge: true });
      router.replace("/" as never);
    } catch {
      setSaveError("Couldn't save your details. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, name, router, school, selectedSubjects, user]);

  const handleConfirm = useCallback(async () => {
    if (!user || isSaving) {
      return;
    }

    await saveProfile();
  }, [isSaving, saveProfile, user]);

  const handleLogin = useCallback(() => {
    router.replace("/login" as never);
  }, [router]);

  const handleSignup = useCallback(() => {
    router.replace("/signup" as never);
  }, [router]);

  if (!user && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.authContainer, { maxWidth: contentMaxWidth }]}>
            <View style={styles.authState}>
              <Text style={styles.authTitle}>You're not signed in</Text>
              <Text style={styles.authText}>
                Log in or create an account to finish setting up your DigiLearn teacher profile.
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
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 40}
        style={styles.keyboardView}
      >
        <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss}>
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
                  <Text style={styles.title}>Teacher Account</Text>
                </View>

                <View style={styles.headerSpacer} />
              </View>

              <InfoMessage>
                Help us personalize your teacher experience and connect your students with relevant learning resources.
              </InfoMessage>

              {isLoading ? (
                <View style={styles.skeletonWrap}>
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonField} />
                  <View style={styles.skeletonField} />
                  <View style={styles.skeletonChips} />
                </View>
              ) : loadError ? (
                <View style={styles.errorState}>
                  <Text style={styles.errorTitle}>We couldn’t load your profile.</Text>
                  <Text style={styles.errorText}>{loadError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading teacher profile"
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
                    <Text style={styles.fieldLabel}>Schools (Optional)</Text>
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
                      Adding your school helps you connect with your students and discover opportunities relevant to your teaching community.
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
                      <Text style={styles.emptySubjects}>No subjects are available yet.</Text>
                    )}

                    <InfoMessage>
                      Your selected subjects can be changed anytime in Preferences. We'll use them to help personalize your teaching experience and connect you with relevant resources.
                    </InfoMessage>
                  </View>

                  {saveError ? <Text style={styles.errorBubble}>{saveError}</Text> : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Confirm teacher account details"
                    disabled={isSaving}
                    onPress={handleConfirm}
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
        </Pressable>
      </KeyboardAvoidingView>
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
  dismissArea: {
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
    marginBottom: spacing.lg,
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
    color: "#FF6269",
    textAlign: "center",
  },
  fieldGroup: {
    marginTop: spacing.xl,
  },
  fieldLabel: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "#FFE0E2",
    borderWidth: 1,
    borderColor: "#F7C9CC",
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333333",
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
    backgroundColor: "#FF6269",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
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
  skeletonWrap: {
    gap: 12,
    paddingTop: spacing.md,
  },
  skeletonLine: {
    height: 18,
    width: "40%",
    backgroundColor: "#F4E8EA",
    borderRadius: 8,
  },
  skeletonField: {
    height: 48,
    width: "100%",
    backgroundColor: "#F4E8EA",
    borderRadius: 10,
  },
  skeletonChips: {
    height: 90,
    width: "100%",
    backgroundColor: "#F4E8EA",
    borderRadius: 10,
  },
});
