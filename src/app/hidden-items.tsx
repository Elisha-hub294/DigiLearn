import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { getHiddenPageEntries } from "../services/userProfile";

type HiddenNote = {
  id: string;
  title?: string;
  description?: string;
  subject?: string | string[];
  preview?: string;
  document?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
  level?: string;
  book?: string | string[];
};

const paddingFor = (width: number) =>
  width >= 1200
    ? 150
    : width >= 900
      ? 50
      : width >= 600
        ? 30
        : width >= 400
          ? 5
          : 3;

export default function HiddenItemsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile } = useProfile();
  const [hiddenNotes, setHiddenNotes] = useState<HiddenNote[]>([]);
  const [loading, setLoading] = useState(true);

  const hiddenIds = useMemo(() => getHiddenPageEntries(profile), [profile]);
  const sortedIds = useMemo(
    () =>
      [...hiddenIds]
        .sort((a, b) => {
          const aTime =
            a.hiddenAt &&
            typeof a.hiddenAt === "object" &&
            "seconds" in a.hiddenAt
              ? Number((a.hiddenAt as any).seconds ?? 0)
              : 0;
          const bTime =
            b.hiddenAt &&
            typeof b.hiddenAt === "object" &&
            "seconds" in b.hiddenAt
              ? Number((b.hiddenAt as any).seconds ?? 0)
              : 0;
          return bTime - aTime;
        })
        .map((entry) => entry.id),
    [hiddenIds],
  );

  useEffect(() => {
    let active = true;
    const loadHiddenNotes = async () => {
      if (!user || sortedIds.length === 0) {
        if (active) {
          setHiddenNotes([]);
          setLoading(false);
        }
        return;
      }

      try {
        const docs = await Promise.all(
          sortedIds.map(async (id) => {
            const snap = await getDoc(doc(db, "pages", id));
            if (!snap.exists()) return null;
            return { id: snap.id, ...(snap.data() as any) } as HiddenNote;
          }),
        );
        if (active) setHiddenNotes(docs.filter(Boolean) as HiddenNote[]);
      } catch (error) {
        console.error("Failed to load hidden pages:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    loadHiddenNotes();
    return () => {
      active = false;
    };
  }, [sortedIds, user]);

  const padding = paddingFor(width);
  const maxWidth = Math.min(1100, width - padding * 2);
  const containerStyle = [
    styles.container,
    { paddingHorizontal: padding, maxWidth },
  ];

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={containerStyle}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.replace("/settings" as never)}
              style={styles.backButton}
              accessibilityLabel="Back to settings"
            >
              <Icon name="arrow-left" size={22} color={colors.dark} />
            </Pressable>
            <Text style={styles.title}>Hidden Items</Text>
          </View>
          <View style={styles.emptyStateCard}>
            <Icon name="eye-off" size={42} color={colors.dark} />
            <Text style={styles.emptyTitle}>
              Sign in to manage hidden items
            </Text>
            <Text style={styles.emptyCopy}>
              Log in or create an account to hide pages and keep your
              preferences across devices.
            </Text>
            <View style={styles.authActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push("/login" as never)}
              >
                <Text style={styles.primaryButtonText}>Log in</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/signup" as never)}
              >
                <Text style={styles.secondaryButtonText}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={containerStyle}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.replace("/settings" as never)}
            style={styles.backButton}
            accessibilityLabel="Back to settings"
          >
            <Icon name="arrow-left" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.title}>Hidden Items</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading hidden items…</Text>
          </View>
        ) : hiddenNotes.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Icon name="eye-off" size={42} color={colors.dark} />
            <Text style={styles.emptyTitle}>No hidden items</Text>
            <Text style={styles.emptyCopy}>
              Pages you hide will appear here, so you can restore them whenever
              you want.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            <FeaturedNoteCard
              notes={hiddenNotes}
              includeHiddenItems={true}
              source="pages"
            />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: {
    flex: 1,
    paddingTop: 18,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: { padding: 6, marginRight: spacing.md },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  contentContainer: { paddingBottom: spacing.xxl },
  emptyStateCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: "#F7F9FC",
    borderRadius: radius.md,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  emptyCopy: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.dark, fontSize: 14 },
  authActions: { flexDirection: "row", gap: 12, marginTop: spacing.xl },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.dark,
  },
  primaryButtonText: { color: colors.white, fontWeight: "600" },
  secondaryButtonText: { color: colors.dark, fontWeight: "600" },
});
