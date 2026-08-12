import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookCarousel } from "../components/home/BookCarousel";
import { CoursesCarousel } from "../components/home/CoursesCarousel";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { FloatingAssistantButton } from "../components/home/FloatingAssistantButton";
import { TeacherPostCard } from "../components/home/TeacherPostCard";
import { TopicalNotesSlider } from "../components/home/TopicalNotesSlider";

import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import LoadingScreen from "./loading";

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function mulberry32(seed: number) {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

type FeedModule = {
  id: string;
  type: string;
  render: () => React.ReactNode;
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());

  // Infinite Scroll & Lazy Loading Pagination State
  const INITIAL_BATCH_SIZE = 3;
  const BATCH_INCREMENT = 2;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset visible batch count & trigger new algorithmic seed
    setVisibleCount(INITIAL_BATCH_SIZE);
    setShuffleSeed(Date.now());
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Modern Feed Pool Definitions
  const candidateModules: Omit<FeedModule, "id">[] = useMemo(
    () => [
      {
        type: "topicalNotes",
        render: () => <TopicalNotesSlider />,
      },
      {
        type: "featuredNote",
        render: () => <FeaturedNoteCard />,
      },
      {
        type: "teacherPost",
        render: () => <TeacherPostCard />,
      },
      {
        type: "courses",
        render: () => (
          <>
            <SectionHeader
              title="Popular courses"
              onSeeAll={() => router.push("/videos")}
            />
            <CoursesCarousel />
          </>
        ),
      },
      {
        type: "books",
        render: () => (
          <>
            <SectionHeader
              title="Books"
              onSeeAll={() => router.push("/library")}
            />
            <BookCarousel />
          </>
        ),
      },
    ],
    [router],
  );

  // Modern Feed Randomization Engine:
  // Generates a rich, non-repetitive feed order based on seed
  const feedItems = useMemo(() => {
    const prng = (index: number) => mulberry32(shuffleSeed + index * 101);

    // Always start with Topical Notes slider as top discovery item
    const topItem: FeedModule = {
      id: `topical-0`,
      type: candidateModules[0].type,
      render: candidateModules[0].render,
    };

    const restPool = candidateModules.slice(1);
    const pool = [...restPool];

    // Fisher-Yates PRNG Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(prng(i) * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Build extended feed items list
    const result: FeedModule[] = [topItem];
    let prevType = topItem.type;

    for (let i = 0; i < pool.length; i++) {
      let candidate = pool[i];
      // Avoid placing identical card type adjacent
      if (candidate.type === prevType && i + 1 < pool.length) {
        candidate = pool[i + 1];
        pool[i + 1] = pool[i];
      }
      result.push({
        id: `${candidate.type}-${i}`,
        type: candidate.type,
        render: candidate.render,
      });
      prevType = candidate.type;
    }

    return result;
  }, [shuffleSeed, candidateModules]);

  // Handle Dynamic Scroll-Triggered Lazy Loading
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 350;
    const isNearEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isNearEnd && !loadingMore && visibleCount < feedItems.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, feedItems.length));
        setLoadingMore(false);
      }, 350);
    }
  };

  if (showLoading) {
    return <LoadingScreen />;
  }

  const visibleFeed = feedItems.slice(0, visibleCount);
  const isAllLoaded = visibleCount >= feedItems.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeInUp.duration(480)} style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.content,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            <Header />
            <SearchBar />

            {visibleFeed.map((item, idx) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.duration(400 + idx * 40)}
                style={styles.section}
              >
                {item.render()}
              </Animated.View>
            ))}

            {/* Inline Lazy Loading & End Footer */}
            <View style={styles.feedFooter}>
              {loadingMore ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loaderText}>Loading more for you...</Text>
                </View>
              ) : isAllLoaded ? (
                <Text style={styles.endText}>You're all caught up! ✨</Text>
              ) : null}
            </View>
          </ScrollView>
          <FloatingAssistantButton />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  section: {
    marginBottom: spacing.sm,
  },
  feedFooter: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loaderText: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "500",
  },
  endText: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
