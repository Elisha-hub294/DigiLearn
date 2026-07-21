import { LatestVideoCard } from "@/components/ui/LatestVideoCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectFilter } from "@/components/ui/SubjectFilter";
import { TrendingCarousel } from "@/components/ui/TrendingCarousel";
import { VideoLesson } from "@/components/ui/TrendingVideoCard";
import { videoColors } from "@/components/ui/videoDesign";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { dimensions } from "../constants/theme";

type FirestoreLesson = {
  id?: string;
  title?: string;
  subject?: string;
  teacher?: string;
  uploadedAt?: unknown;
  duration?: string;
  thumbnail?: string;
  link?: string;
  avatar?: string;
};

type LessonRecord = VideoLesson & { _uploadedAtDate?: Date; link?: string };

function parseUploadedDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      const parsed = candidate.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
    }
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const candidate = value as { seconds?: number };
    if (typeof candidate.seconds === "number") {
      const parsed = new Date(candidate.seconds * 1000);
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
    }
  }
  return null;
}

function formatUploadedAt(value: unknown): string {
  const parsed = parseUploadedDate(value);
  if (!parsed) {
    return "Recently added";
  }
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "1 day ago";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isNewLesson(value: unknown): boolean {
  const parsed = parseUploadedDate(value);
  if (!parsed) {
    return false;
  }
  return Date.now() - parsed.getTime() < 7 * 24 * 60 * 60 * 1000;
}

function toLessonRecord(item: FirestoreLesson, index: number): LessonRecord {
  const uploadedAtValue = item.uploadedAt;
  const uploadedAtDate = parseUploadedDate(uploadedAtValue);
  return {
    id: item.id ?? `${item.title ?? "lesson"}-${index}`,
    title: item.title ?? "Untitled lesson",
    subject: item.subject ?? "General",
    teacher: item.teacher ?? "Teacher",
    uploadedAt: formatUploadedAt(uploadedAtValue),
    duration: item.duration ?? "00:00",
    thumbnail: item.thumbnail ?? "",
    avatar: item.avatar ?? "",
    link: item.link ?? "",
    isNew: isNewLesson(uploadedAtValue),
    _uploadedAtDate: uploadedAtDate ?? undefined,
  };
}

export default function VideosScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [subject, setSubject] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isTablet = width >= 768;
  const horizontalPadding = dimensions.screenPaddingHorizontal;
  const contentWidth =
    Math.min(width, dimensions.maxContentWidth) - horizontalPadding * 2;
  const cardWidth = isTablet
    ? Math.min(contentWidth * 0.72, 480)
    : Math.min(contentWidth * 0.9, 570);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "trendingLessons"),
      (snapshot) => {
        const nextLessons = snapshot.docs
          .map((doc, index) =>
            toLessonRecord(doc.data() as FirestoreLesson, index),
          )
          .sort((left, right) => {
            const leftTime = left._uploadedAtDate?.getTime() ?? 0;
            const rightTime = right._uploadedAtDate?.getTime() ?? 0;
            return rightTime - leftTime;
          });
        setLessons(nextLessons);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  }, []);

  const visibleLatest = useMemo(() => {
    if (subject === "All") {
      return lessons;
    }
    return lessons.filter(
      (lesson) => lesson.subject.toLowerCase() === subject.toLowerCase(),
    );
  }, [lessons, subject]);

  const trendingLessons = useMemo(() => {
    if (subject === "All") {
      return lessons.slice(0, 3);
    }
    return visibleLatest.slice(0, 3);
  }, [lessons, subject, visibleLatest]);

  const showEmptyState = !loading && visibleLatest.length === 0;

  const header = useMemo(
    () => (
      <>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Lessons</Text>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            hitSlop={10}
            style={styles.bell}
          >
            <Ionicons name="play-outline" size={30} color={videoColors.ink} />
            <View style={styles.dot} />
          </Pressable>
        </View>
        <SearchBar />
        <View style={styles.filter}>
          <SubjectFilter selected={subject} onSelect={setSubject} />
        </View>
        <View style={styles.section}>
          <SectionHeader title="Trending ⚡" />
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color={videoColors.primary} />
            </View>
          ) : (
            <TrendingCarousel items={trendingLessons} cardWidth={cardWidth} />
          )}
        </View>
        <View style={styles.latestHeading}>
          <SectionHeader title="Latest" />
        </View>
      </>
    ),
    [cardWidth, loading, subject, trendingLessons],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <Animated.View
        entering={FadeIn.duration(380)}
        style={[
          styles.container,
          {
            maxWidth: dimensions.maxContentWidth,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {showEmptyState ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.emptyStateContainer}
          >
            <View style={styles.emptyHeader}>{header}</View>
            <View style={styles.emptyState}>
              <Image
                source={{
                  uri: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/images/empty.png",
                }}
                style={styles.emptyImage}
                contentFit="contain"
              />
              <Text style={styles.emptyTitle}>
                No lessons in this subject yet
              </Text>
              <Text style={styles.emptyText}>
                Try another subject or add a new lesson to this collection.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlashList
            key={`latest-${isTablet ? 2 : 1}`}
            data={visibleLatest}
            numColumns={isTablet ? 2 : 1}
            renderItem={({ item, index }) => (
              <LatestVideoCard item={item} index={index} isGrid={isTablet} />
            )}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={header}
            ListFooterComponent={
              <Image
                source={require("../../assets/images/footer-vids.png")}
                contentFit="contain"
                style={styles.footerImage}
                accessibilityLabel="Learning together illustration"
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={videoColors.primary}
              />
            }
          />
        )}
      </Animated.View>
      <Pressable
        accessibilityLabel="Add a new lesson"
        accessibilityRole="button"
        onPress={() => router.push("/add-trending-lesson" as never)}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#fff", flex: 1 },
  container: { alignSelf: "center", flex: 1, width: "100%" },
  listContent: { paddingBottom: 124 },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 8,
  },
  pageTitle: {
    color: "#111",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  bell: { padding: 0, position: "relative" },
  dot: {
    backgroundColor: "#FF3B30",
    borderColor: "#fff",
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    position: "absolute",
    right: 4,
    top: 3,
    width: 10,
  },
  filter: { marginTop: 18 },
  section: { marginTop: 30 },
  latestHeading: { marginTop: 34 },
  footerImage: {
    alignSelf: "center",
    height: 250,
    marginTop: 18,
    width: "90%",
  },
  emptyStateContainer: {
    flex: 1,
  },
  emptyHeader: {
    paddingHorizontal: 0,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyImage: {
    height: 220,
    marginBottom: 18,
    width: "100%",
  },
  emptyTitle: {
    color: "#111",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  loader: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  fab: {
    alignItems: "center",
    backgroundColor: videoColors.primary,
    borderRadius: 28,
    bottom: 28,
    elevation: 6,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    width: 56,
  },
});
