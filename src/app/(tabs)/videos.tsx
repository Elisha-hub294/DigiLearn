import { getTrendingCardWidth } from "@/components/ui/TrendingCarousel";
import { VideoLesson } from "@/components/ui/TrendingVideoCard";
import { VideoCard } from "@/components/ui/VideoCard";
import { VideosScreenHeader } from "@/components/ui/VideosScreenHeader";
import { getVideoThumbnailUrl } from "@/utils/videoUtils";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, spacing } from "../../constants/theme";
import { loadTrendingLessons } from "../../services/trendingLessonsService";

type FirestoreLesson = {
  id?: string;
  title?: string;
  subject?: string | string[];
  teacher?: string;
  uploadedAt?: unknown;
  duration?: string;
  thumbnail?: string;
  link?: string;
  description?: string;
  avatar?: string;
  visits?: number | string;
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

function parseVisits(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function toLessonRecord(item: FirestoreLesson, index: number): LessonRecord {
  const uploadedAtValue = item.uploadedAt;
  const uploadedAtDate = parseUploadedDate(uploadedAtValue);
  const link = item.link ?? "";
  const thumbnail = getVideoThumbnailUrl(item.thumbnail, link);
  return {
    id: item.id ?? `${item.title ?? "lesson"}-${index}`,
    title: item.title ?? "Untitled lesson",
    subject: Array.isArray(item.subject)
      ? item.subject.join(", ") || "General"
      : (item.subject ?? "General"),
    teacher: item.teacher ?? "Teacher",
    uploadedAt: formatUploadedAt(uploadedAtValue),
    duration: item.duration ?? "00:00",
    thumbnail,
    avatar: item.avatar ?? "",
    link,
    description: item.description ?? "",
    isNew: isNewLesson(uploadedAtValue),
    visits: parseVisits(item.visits),
    _uploadedAtDate: uploadedAtDate ?? undefined,
  };
}

export default function VideosScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const [subject, setSubject] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const flashListRef = useRef<FlashListRef<LessonRecord>>(null);
  const trendingSectionY = useRef<number>(0);
  const isTablet = width >= 768;
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const contentWidth = Math.min(width, contentMaxWidth) - horizontalPadding * 2;
  const cardWidth = getTrendingCardWidth(width, contentWidth);

  const loadVideos = useCallback(async (force = false) => {
    try {
      const cachedLessons = await loadTrendingLessons(force);
      const nextLessons = cachedLessons
        .map((lesson, index) => toLessonRecord(lesson, index))
        .sort((left, right) => {
          const leftTime = left._uploadedAtDate?.getTime() ?? 0;
          const rightTime = right._uploadedAtDate?.getTime() ?? 0;
          return rightTime - leftTime;
        });
      setLessons(nextLessons);
      setIsOffline(false);
    } catch (error) {
      console.warn("Failed to load trending lessons:", error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadVideos(refreshToken > 0);
    });

    return () => {
      active = false;
    };
  }, [loadVideos, refreshToken]);

  // Auto-scroll to Trending Lessons section every time the screen
  // gains focus with the scrollTo=trending param
  useFocusEffect(
    useCallback(() => {
      if (scrollTo === "trending" && !loading && trendingSectionY.current > 0) {
        const timer = setTimeout(() => {
          flashListRef.current?.scrollToOffset({
            offset: trendingSectionY.current,
            animated: true,
          });
        }, 400);
        return () => clearTimeout(timer);
      }
    }, [scrollTo, loading]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    const addTabPressListener = navigation.addListener as unknown as (
      eventName: "tabPress",
      listener: (event: { target?: string }) => void,
    ) => () => void;

    return addTabPressListener("tabPress", (event) => {
      if (event.target !== route.key) return;

      flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
      onRefresh();
    });
  }, [navigation, onRefresh, route.key]);

  const visibleLatest = useMemo(() => {
    if (subject === "All") {
      return lessons;
    }
    return lessons.filter((lesson) =>
      lesson.subject
        .split(", ")
        .some((item) => item.toLowerCase() === subject.toLowerCase()),
    );
  }, [lessons, subject]);

  const trendingLessons = useMemo(() => {
    if (subject === "All") {
      return [...lessons]
        .sort((left, right) => Number(right.visits) - Number(left.visits))
        .slice(0, 3);
    }
    return [...visibleLatest]
      .sort((left, right) => Number(right.visits) - Number(left.visits))
      .slice(0, 3);
  }, [lessons, subject, visibleLatest]);

  const showEmptyState = !loading && !isOffline && visibleLatest.length === 0;
  const onlineEmptyTitle = isOffline
    ? "You're offline"
    : "No lessons in this subject yet";
  const onlineEmptyMessage = isOffline
    ? "Check your internet connection and try again."
    : "Try another subject or check back soon for new lessons.";

  const header = useMemo(
    () => (
      <VideosScreenHeader
        subject={subject}
        setSubject={setSubject}
        loading={loading}
        lessons={lessons}
        trendingLessons={trendingLessons}
        cardWidth={cardWidth}
        onTrendingSectionLayout={(y) => {
          trendingSectionY.current = y;
        }}
      />
    ),
    [subject, loading, lessons, trendingLessons, cardWidth],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <Animated.View
        entering={FadeIn.duration(380)}
        style={[styles.container, { maxWidth: contentMaxWidth }]}
      >
        {showEmptyState || (isOffline && lessons.length === 0) ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.emptyStateContainer}
            contentContainerStyle={[
              styles.listContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.emptyHeader}>{header}</View>
            <View style={styles.emptyState}>
              <Image
                source={require("@/assets/images/empty.png")}
                style={styles.emptyImage}
                contentFit="contain"
              />
              <Text style={styles.emptyTitle}>{onlineEmptyTitle}</Text>
              <Text style={styles.emptyText}>{onlineEmptyMessage}</Text>
            </View>
          </ScrollView>
        ) : (
          <FlashList
            ref={flashListRef}
            key={`latest-${isTablet ? 2 : 1}`}
            data={visibleLatest}
            numColumns={isTablet ? 2 : 1}
            renderItem={({ item, index }) => (
              <VideoCard item={item} index={index} isGrid={isTablet} />
            )}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={header}
            contentContainerStyle={[
              styles.listContent,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  container: { alignSelf: "center", flex: 1, width: "100%" },
  listContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    width: "100%",
  },

  section: { marginTop: 30 },
  latestHeading: { marginTop: 34 },
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
    marginBottom: 10,
    width: "100%",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
