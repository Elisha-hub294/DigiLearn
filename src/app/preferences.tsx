import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

type Subject = { id: string; name: string };

function PreferenceChip({
  name,
  selected,
  onPress,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${name}, ${selected ? "selected" : "not selected"}`}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {name}
      </Text>
    </Pressable>
  );
}

function AuthPrompt() {
  const router = useRouter();
  return (
    <View style={styles.authPrompt}>
      <Feather name="sliders" size={32} color={colors.primary} />
      <Text style={styles.authTitle}>Personalize your learning</Text>
      <Text style={styles.authCopy}>
        Sign in or create a DigiLearn account to choose your subjects and get a
        more personalized learning experience.
      </Text>
      <View style={styles.authActions}>
        <Pressable
          onPress={() => router.push("/login" as never)}
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
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, loading: profileLoading } = useProfile();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initialized = useRef(false);
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  const loadSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    setLoadError(false);
    try {
      const snapshot = await getDocs(collection(db, "subject"));
      const seen = new Set<string>();
      const available = snapshot.docs.reduce<Subject[]>((result, item) => {
        const name =
          typeof item.data().name === "string" ? item.data().name.trim() : "";
        const key = name.toLocaleLowerCase();
        if (name && !seen.has(key)) {
          seen.add(key);
          result.push({ id: item.id, name });
        }
        return result;
      }, []);
      setSubjects(available);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (!initialized.current && !profileLoading) {
      const seen = new Set<string>();
      setSelected(
        (profile?.subjects ?? []).reduce<string[]>((result, name) => {
          const clean = typeof name === "string" ? name.trim() : "";
          const key = clean.toLocaleLowerCase();
          if (clean && !seen.has(key)) {
            seen.add(key);
            result.push(clean);
          }
          return result;
        }, []),
      );
      initialized.current = true;
    }
  }, [profile?.subjects, profileLoading]);

  const toggle = (name: string) =>
    setSelected((current) =>
      current.some(
        (item) =>
          item.localeCompare(name, undefined, { sensitivity: "accent" }) === 0,
      )
        ? current.filter(
            (item) =>
              item.localeCompare(name, undefined, { sensitivity: "accent" }) !==
              0,
          )
        : [...current, name],
    );

  const arraysEqualIgnoreOrder = (a: string[], b: any[]) => {
    const norm = (arr: any[]) =>
      arr
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
        .sort();
    const A = norm(a);
    const B = norm(b);
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
  };

  const save = async () => {
    if (!user || saving) return;
    const original = profile?.subjects ?? [];
    if (arraysEqualIgnoreOrder(selected, original)) {
      setSaved(true);
      return;
    }
    try {
      setSaving(true);
      setSaved(false);
      setSaveError(false);
      await updateDoc(doc(db, "users", user.uid), { subjects: selected });
      setSaved(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const isLoading = profileLoading || loadingSubjects;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Pressable
                  onPress={() => router.replace("/settings" as never)}
                  style={styles.backButton}
                  accessibilityLabel="Back to profile"
                >
                  <Feather name="arrow-left" size={22} color={colors.dark} />
                </Pressable>
                <Text style={styles.title}>Preferences</Text>
              </View>
              {user ? (
                <Pressable
                  onPress={save}
                  disabled={saving || isLoading}
                  style={styles.saveButton}
                  accessibilityLabel="Save preferences"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text
                      style={[styles.saveText, isLoading && styles.disabled]}
                    >
                      Save
                    </Text>
                  )}
                </Pressable>
              ) : (
                <View style={styles.headerButton} />
              )}
            </View>

            {!user && !profileLoading ? (
              <AuthPrompt />
            ) : isLoading ? (
              <View style={styles.skeleton}>
                <View style={styles.skeletonText} />
                <View style={styles.skeletonHeading} />
                <View style={styles.skeletonChips} />
              </View>
            ) : loadError ? (
              <View style={styles.error}>
                <Text style={styles.errorTitle}>
                  We couldn’t load preferences.
                </Text>
                <Text style={styles.errorCopy}>
                  Check your connection and try again.
                </Text>
                <Pressable onPress={loadSubjects} style={styles.retry}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.helper}>
                  Choose the subjects you're interested in to personalize your
                  home feed, recommendations, and learning resources.
                </Text>
                <Text style={styles.sectionTitle}>My Subjects</Text>
                {subjects.length ? (
                  <View style={styles.chips}>
                    {subjects.map((subject) => (
                      <PreferenceChip
                        key={subject.id}
                        name={subject.name}
                        selected={selected.some(
                          (item) =>
                            item.toLocaleLowerCase() ===
                            subject.name.toLocaleLowerCase(),
                        )}
                        onPress={() => toggle(subject.name)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>
                      No subjects available yet.
                    </Text>
                    <Text style={styles.emptyCopy}>
                      We're preparing more subjects for you.
                    </Text>
                  </View>
                )}
                {saved ? (
                  <Text style={styles.success}>Preferences saved.</Text>
                ) : null}
                {saveError ? (
                  <Text style={styles.saveError}>
                    Couldn't save preferences. Please try again.
                  </Text>
                ) : null}
              </>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </View>
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
    height: 68,
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
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  saveButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontSize: 16, color: "#3B82F6", fontWeight: "600" },
  disabled: { opacity: 0.45 },
  helper: {
    marginTop: 38,
    maxWidth: 390,
    color: "#FF6B6B",
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 38,
    marginBottom: 14,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#555",
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  chipPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  chipText: { fontSize: 12, color: "#555" },
  chipTextSelected: { color: "#fff" },
  authPrompt: { paddingTop: 90, alignItems: "center" },
  authTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginTop: 14 },
  authCopy: {
    marginTop: 8,
    maxWidth: 360,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B6B",
  },
  authActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  login: {
    minWidth: 96,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: { color: "#3B82F6", fontWeight: "700" },
  signup: {
    minWidth: 96,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  signupText: { color: "#fff", fontWeight: "700" },
  skeleton: { marginTop: 38, gap: 18 },
  skeletonText: {
    height: 36,
    width: "78%",
    borderRadius: 6,
    backgroundColor: "#EDF2F8",
  },
  skeletonHeading: {
    height: 20,
    width: 110,
    borderRadius: 6,
    backgroundColor: "#EDF2F8",
    marginTop: 18,
  },
  skeletonChips: {
    height: 95,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#EDF2F8",
  },
  error: { paddingTop: 80, alignItems: "center" },
  errorTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  errorCopy: { color: "#6B6B6B", marginTop: 8 },
  retry: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  retryText: { color: "#3B82F6", fontWeight: "700" },
  empty: { paddingVertical: 18 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  emptyCopy: { marginTop: 5, color: "#6B6B6B", fontSize: 14 },
  success: { marginTop: 24, color: "#238636", fontSize: 14, fontWeight: "600" },
  saveError: { marginTop: 12, color: "#FF6B6B", fontSize: 14 },
});
