import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { setTeacherCommunityMembership } from "../../services/teacherCommunity";
import { showNativeToast } from "../../utils/nativeToast";
import { SectionHeader } from "../ui/SectionHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeacherSuggestion = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  subjects?: string[];
  accent?: string;
  verified?: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const ACCENT_PALETTE = [
  "#006eff",
  "#7C3AED",
  "#059669",
  "#DC2626",
  "#D97706",
  "#0891B2",
  "#BE185D",
  "#4F46E5",
] as const;

function getAccent(id: string, customAccent?: string) {
  if (customAccent) return customAccent;
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── FollowButton ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FollowButton({
  teacherId,
  isFollowed,
  onToggle,
  accent,
}: {
  teacherId: string;
  isFollowed: boolean;
  onToggle: (id: string, next: boolean) => void;
  accent: string;
}) {
  const [loading, setLoading] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (loading) return;
    scale.value = withSpring(0.92, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    setLoading(true);
    try {
      const next = !isFollowed;
      await setTeacherCommunityMembership(teacherId, next);
      onToggle(teacherId, next);
      showNativeToast(next ? "Following teacher 🎉" : "Unfollowed");
    } catch {
      showNativeToast("Could not update follow status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.followBtn,
        animatedStyle,
        isFollowed
          ? [styles.followBtnFollowed, { borderColor: accent }]
          : [styles.followBtnDefault, { backgroundColor: accent }],
      ]}
      accessibilityRole="button"
      accessibilityLabel={isFollowed ? "Unfollow teacher" : "Follow teacher"}
    >
      {loading ? (
        <ActivityIndicator
          size={12}
          color={isFollowed ? accent : "#fff"}
          style={{ marginRight: 4 }}
        />
      ) : (
        <Ionicons
          name={isFollowed ? "checkmark" : "add"}
          size={13}
          color={isFollowed ? accent : "#fff"}
          style={{ marginRight: 3 }}
        />
      )}
      <Text
        style={[styles.followBtnText, { color: isFollowed ? accent : "#fff" }]}
      >
        {isFollowed ? "Following" : "Follow"}
      </Text>
    </AnimatedPressable>
  );
}

// ─── TeacherCard ─────────────────────────────────────────────────────────────

function TeacherCard({
  teacher,
  isFollowed,
  onToggle,
  index,
}: {
  teacher: TeacherSuggestion;
  isFollowed: boolean;
  onToggle: (id: string, next: boolean) => void;
  index: number;
}) {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const accent = getAccent(teacher.id, teacher.accent);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = index * 55;
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 350 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
    }, delay);
    return () => clearTimeout(timer);
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const subjects = teacher.subjects?.slice(0, 2) ?? [];
  const initials = getInitials(teacher.name);

  const handlePress = () => {
    router.push({
      pathname: "/teacher-profile",
      params: { id: teacher.id },
    } as any);
  };

  return (
    <Animated.View
      style={[styles.card, animStyle, { backgroundColor: themeColors.surface }]}
    >
      <Pressable onPress={handlePress} style={styles.cardInner}>
        {/* Subtle accent gradient strip at top */}
        <LinearGradient
          colors={[accent + "40", accent + "00"]}
          style={styles.cardAccentStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Avatar with accent ring */}
        <View style={[styles.avatarRing, { borderColor: accent + "66" }]}>
          {teacher.avatar ? (
            <Image
              source={teacher.avatar}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[accent, accent + "AA"]}
              style={styles.avatarFallback}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}

          {/* Verified badge */}
          {teacher.verified && (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: accent, borderColor: themeColors.surface },
              ]}
            >
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          )}
        </View>

        {/* Teacher name */}
        <Text
          style={[styles.teacherName, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {teacher.name}
        </Text>

        {/* Bio */}
        {teacher.bio ? (
          <Text
            style={[styles.teacherBio, { color: themeColors.subtitle }]}
            numberOfLines={2}
          >
            {teacher.bio}
          </Text>
        ) : null}

        {/* Subject chips */}
        {subjects.length > 0 && (
          <View style={styles.subjectRow}>
            {subjects.map((sub) => (
              <View
                key={sub}
                style={[styles.subjectChip, { backgroundColor: accent + "18" }]}
              >
                <Text
                  style={[styles.subjectChipText, { color: accent }]}
                  numberOfLines={1}
                >
                  {sub}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {/* Follow button */}
      <View style={styles.followBtnWrapper}>
        <FollowButton
          teacherId={teacher.id}
          isFollowed={isFollowed}
          onToggle={onToggle}
          accent={accent}
        />
      </View>
    </Animated.View>
  );
}

// ─── TeacherFollowCarousel (Main export) ─────────────────────────────────────

export function TeacherFollowCarousel({ seed = 0 }: { seed?: number }) {
  const { colors: themeColors } = useTheme();
  const { profile, user } = useProfile();

  const [teachers, setTeachers] = useState<TeacherSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  // Shuffle teachers with the provided seed for stable random order
  const shuffled = useMemo(
    () => seededShuffle(teachers, seed),
    [teachers, seed],
  );

  // Show up to 10 not-yet-followed teachers as suggestions
  const suggestions = useMemo(() => {
    return shuffled.filter((t) => !followedIds.has(t.id)).slice(0, 10);
  }, [shuffled, followedIds]);

  // Fetch teachers from Firestore
  useEffect(() => {
    let active = true;

    async function fetchTeachers() {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        if (!active) return;

        const list: TeacherSuggestion[] = [];
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const name = typeof d.name === "string" ? d.name.trim() : "";
          if (!name) return;
          list.push({
            id: docSnap.id,
            name,
            avatar: typeof d.avatar === "string" ? d.avatar : undefined,
            bio:
              typeof d.bio === "string" && d.bio.trim()
                ? d.bio.trim()
                : undefined,
            subjects: Array.isArray(d.subjects)
              ? d.subjects.filter(
                  (s: unknown): s is string => typeof s === "string",
                )
              : typeof d.subject === "string" && d.subject.trim()
                ? [d.subject.trim()]
                : [],
            accent: typeof d.accent === "string" ? d.accent : undefined,
            verified: d.verified === true,
          });
        });
        setTeachers(list);
      } catch (err) {
        console.warn("TeacherFollowCarousel: failed to fetch teachers", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTeachers();
    return () => {
      active = false;
    };
  }, []);

  // Seed followedIds from the user's profile
  useEffect(() => {
    setFollowedIds(new Set(profile?.followedTeacherIds ?? []));
  }, [profile?.followedTeacherIds]);

  const handleToggle = useCallback((id: string, next: boolean) => {
    setFollowedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }, []);

  // Only render for authenticated users
  if (!user) return null;
  // Hide once loading is done and there are no suggestions left
  if (!loading && suggestions.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <SectionHeader
        title="Join your Teachers"
        subtitle="Discover educators on OSplatform"
      />

      {loading ? (
        // Skeleton placeholder row
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.skeleton,
                { backgroundColor: themeColors.surface },
              ]}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
          renderItem={({ item, index }) => (
            <TeacherCard
              teacher={item}
              isFollowed={followedIds.has(item.id)}
              onToggle={handleToggle}
              index={index}
            />
          )}
        />
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_WIDTH = 160;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.md,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        boxShadow: "0px 2px 12px rgba(0,0,0,0.08)",
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 2px 12px rgba(0,0,0,0.08)" } as any,
    }),
  },
  cardInner: {
    padding: spacing.md,
    alignItems: "center",
    gap: 6,
  },
  cardAccentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    padding: 2,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    // borderColor applied inline via themeColors.surface
  },
  teacherName: {
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  teacherBio: {
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 16,
    opacity: 0.85,
  },
  subjectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    marginTop: 2,
  },
  subjectChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: CARD_WIDTH - 24,
  },
  subjectChipText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  followBtnWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 2,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    width: "100%",
  },
  followBtnDefault: {
    // backgroundColor set inline
  },
  followBtnFollowed: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  // Skeleton
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  skeleton: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: radius.md,
    opacity: 0.5,
  },
});
