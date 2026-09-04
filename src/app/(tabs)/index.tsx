import { useRouter } from "expo-router";
import { useNavigation, useRoute } from "expo-router/react-navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { BookCarousel } from "../../components/home/BookCarousel";
import { CoursesCarousel } from "../../components/home/CoursesCarousel";
import { FeaturedNoteCard } from "../../components/home/FeaturedNoteCard";
import { FloatingAssistantButton } from "../../components/home/FloatingAssistantButton";
import { TeacherPostCard } from "../../components/home/TeacherPostCard";
import { TopicalNotesSlider } from "../../components/home/TopicalNotesSlider";
import { PaperCarousel } from "../../components/library/PaperCarousel";
import { Skeleton } from "../../components/ui/Skeleton";

import { auth } from "../../../firebaseConfig";
import { Header } from "../../components/ui/Header";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { PaperSection, useLibraryData } from "../../hooks/useLibraryData";
import { clearGuestMode, isGuestMode } from "../../services/guestService";
import { getUserOnboardingState } from "../../services/userProfile";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import LoadingScreen from "../loading";

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

function HomePastPapers({
  collections,
  onSeeAll,
}: {
  collections: PaperSection[];
  onSeeAll: (paperType?: string, paperYear?: string) => void;
}) {
  const groups = useMemo(() => {
    const grouped = new Map<string, PaperSection[]>();

    collections.forEach((section) => {
      const type = section.type.trim() || "Other";
      const sections = grouped.get(type) ?? [];
      sections.push(section);
      grouped.set(type, sections);
    });

    return Array.from(grouped.entries()).map(([type, sections]) => ({
      type: type || "Other",
      paperType: type,
      sections: sections.sort(
        (a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10),
      ),
    }));
  }, [collections]);

  return (
    <View>
      {groups.map((group) => (
        <View key={group.type} style={styles.paperTypeSection}>
          {group.sections.map((section) => (
            <View key={`${section.type}-${section.year}`}>
              <SectionHeader
                title={section.title}
                onSeeAll={() => onSeeAll(section.type, section.year)}
                actionLabel="See all"
              />
              <PaperCarousel items={section.items} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { paperCollections } = useLibraryData();
  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [authCheckReady, setAuthCheckReady] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const scrollRef = useRef<ScrollView>(null);

  // Infinite Scroll & Lazy Loading Pagination State
  const INITIAL_BATCH_SIZE = 3;
  const BATCH_INCREMENT = 2;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const filteredPaperCollections = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return paperCollections;

    return paperCollections
      .map((section) => ({
        ...section,
        items: section.items.filter((paper) =>
          matchesUserInterests(paper.subject, profile?.subjects),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [paperCollections, profile]);
  const hasPastPapers = filteredPaperCollections.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const guest = await isGuestMode();
        setAuthCheckReady(true);
        if (!guest) {
          router.replace("/welcome" as never);
        }
        return;
      }

      await clearGuestMode();

      if (
        !user.emailVerified &&
        user.providerData.some((provider) => provider.providerId === "password")
      ) {
        setAuthCheckReady(true);
        router.replace({
          pathname: "/verify-email",
          params: { next: "/" },
        });
        return;
      }

      try {
        const onboarding = await getUserOnboardingState(user.uid);
        const completed = onboarding.accountTypeCompleted;

        setAuthCheckReady(true);

        if (!completed) {
          router.replace("/account-type" as never);
        }
      } catch {
        setAuthCheckReady(true);
        router.replace("/welcome" as never);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset visible batch count & trigger new algorithmic seed
    setVisibleCount(INITIAL_BATCH_SIZE);
    setShuffleSeed(Date.now());
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const addTabPressListener = navigation.addListener as unknown as (
      eventName: "tabPress",
      listener: (event: { target?: string }) => void,
    ) => () => void;

    return addTabPressListener("tabPress", (event) => {
      if (event.target !== route.key) return;

      scrollRef.current?.scrollTo({ y: 0, animated: true });
      onRefresh();
    });
  }, [navigation, onRefresh, route.key]);

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
        render: () => <CoursesCarousel />,
      },
      {
        type: "books",
        render: () => <BookCarousel />,
      },
      ...(hasPastPapers
        ? [
            {
              type: "pastPapers",
              render: () => (
                <HomePastPapers
                  collections={filteredPaperCollections}
                  onSeeAll={(paperType, paperYear) =>
                    router.push(
                      paperType
                        ? ({
                            pathname: "/see-all",
                            params: {
                              type: "papers",
                              paperType,
                              ...(paperYear ? { paperYear } : {}),
                            },
                          } as any)
                        : "/see-all?type=papers",
                    )
                  }
                />
              ),
            },
          ]
        : []),
    ],
    [filteredPaperCollections, hasPastPapers, router],
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
        setVisibleCount((prev) =>
          Math.min(prev + BATCH_INCREMENT, feedItems.length),
        );
        setLoadingMore(false);
      }, 350);
    }
  };

  if (showLoading || !authCheckReady) {
    return <LoadingScreen />;
  }

  const visibleFeed = feedItems.slice(0, visibleCount);
  const isAllLoaded = visibleCount >= feedItems.length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <Animated.View entering={FadeInUp.duration(480)} style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <ScrollView
            ref={scrollRef}
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
            <Header showPublishButton />
            <SearchBar placeholder="Search DigiLearn..." />

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
                <View
                  style={styles.loaderWrap}
                  accessibilityLabel="Loading more resources"
                >
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} style={styles.loaderSkeleton} />
                  ))}
                </View>
              ) : isAllLoaded ? (
                <Text style={[styles.endText, { color: themeColors.subtitle }]}>
                  You&apos;re all caught up! ✨
                </Text>
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
  paperTypeSection: {
    marginBottom: spacing.lg,
  },
  paperYear: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  feedFooter: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderWrap: {
    width: "100%",
    gap: spacing.sm,
  },
  loaderSkeleton: { width: "100%", height: 64, borderRadius: 10 },
  endText: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
