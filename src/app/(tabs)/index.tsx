import { useRouter } from "expo-router";
import { useNavigation, useRoute } from "expo-router/react-navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../../firebaseConfig";
import { BookCarousel } from "../../components/home/BookCarousel";
import { ContinueLearningShelf } from "../../components/home/ContinueLearningShelf";
import { CoursesCarousel } from "../../components/home/CoursesCarousel";
import {
  FeaturedNoteItem,
  loadFeaturedNotes,
  loadFeaturedNotesMetadata,
  TopicalNote,
} from "../../components/home/FeaturedNoteCard";
import { FloatingAssistantButton } from "../../components/home/FloatingAssistantButton";
import { PublicHome } from "../../components/home/PublicHome";
import {
  loadTeacherMetadata,
  loadTeacherPosts,
  TeacherPost,
  TeacherPostItem,
} from "../../components/home/TeacherPostCard";
import { TopicalNotesSlider } from "../../components/home/TopicalNotesSlider";
import { BookCard } from "../../components/library/BookCard";
import { PaperCard } from "../../components/library/PaperCard";
import { PaperCarousel } from "../../components/library/PaperCarousel";
import { Header } from "../../components/ui/Header";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { VideoLesson } from "../../components/ui/TrendingVideoCard";
import { VideoCard } from "../../components/ui/VideoCard";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PaperItem,
  useLibraryData,
} from "../../hooks/useLibraryData";
import { recordUserActivity } from "../../services/activityService";
import { BookRecord, loadBooks } from "../../services/booksService";
import { clearGuestMode, isGuestMode } from "../../services/guestService";
import { loadTrendingLessons } from "../../services/trendingLessonsService";
import { getFollowedTeacherIds } from "../../services/teacherCommunity";
import { getUserOnboardingState } from "../../services/userProfile";
import { interleaveFeedItems } from "../../utils/feedAlgorithm";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import LoadingScreen from "../loading";

type FeedItem =
  | { kind: "teacherPost"; id: string; data: TeacherPost; subject?: string }
  | { kind: "videoLesson"; id: string; data: VideoLesson; subject?: string }
  | { kind: "featuredNote"; id: string; data: TopicalNote; subject?: string }
  | { kind: "book"; id: string; data: BookRecord; subject?: string }
  | { kind: "paper"; id: string; data: PaperItem; subject?: string }
  | { kind: "break"; id: string; type: string; render: () => React.ReactNode };

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { profile, user } = useProfile();
  const { paperCollections, onRefresh: refreshLibraryData } = useLibraryData();

  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(Platform.OS !== "web");
  const [authCheckReady, setAuthCheckReady] = useState(Platform.OS === "web");
  const [authUser, setAuthUser] = useState<User | null>(auth.currentUser);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const scrollRef = useRef<ScrollView>(null);

  // Raw Content Pools
  const [teacherPosts, setTeacherPosts] = useState<TeacherPost[]>([]);
  const [followedTeacherIds, setFollowedTeacherIds] = useState<string[]>([]);
  const [teacherMeta, setTeacherMeta] = useState<{
    teacherAvatars: Record<string, string>;
    ownerProfiles: Record<string, { name: string; avatar?: string }>;
    defaultUserAvatar: string | null;
  }>({ teacherAvatars: {}, ownerProfiles: {}, defaultUserAvatar: null });

  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [featuredNotes, setFeaturedNotes] = useState<TopicalNote[]>([]);
  const [notesMeta, setNotesMeta] = useState<{
    subjectAvatars: Record<string, string>;
    defaultAvatar: string;
  }>({ subjectAvatars: {}, defaultAvatar: "" });

  const [books, setBooks] = useState<BookRecord[]>([]);

  // Infinite Scroll & Lazy Loading Pagination State
  const INITIAL_BATCH_SIZE = 7;
  const BATCH_INCREMENT = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  // Fetch all pool data
  const loadAllFeedPools = useCallback(async (force = false) => {
    try {
      const [posts, tMeta, lessons, notes, nMeta, bks, followedTeachers] = await Promise.all([
        loadTeacherPosts(),
        loadTeacherMetadata(),
        loadTrendingLessons(force),
        loadFeaturedNotes(),
        loadFeaturedNotesMetadata(),
        loadBooks(force),
        user
          ? getFollowedTeacherIds().catch((error) => {
              console.warn("Failed to load followed teachers:", error);
              return [];
            })
          : Promise.resolve([]),
      ]);

      setTeacherPosts(posts);
      setFollowedTeacherIds(followedTeachers);
      setTeacherMeta(tMeta);
      setVideoLessons(
        lessons.map((lesson) => ({
          ...lesson,
          uploadedAt: lesson.uploadedAt || "Recently added",
        })),
      );
      setFeaturedNotes(notes);
      setNotesMeta(nMeta);
      setBooks(bks);
    } catch (err) {
      console.warn("Failed to load feed pool data:", err);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadAllFeedPools();
    });
    const timer = setTimeout(() => {
      if (active) setShowLoading(false);
    }, 1000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadAllFeedPools]);

  // Auth gate check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        const guest = await isGuestMode();
        setAuthCheckReady(true);
        if (!guest && Platform.OS !== "web") {
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

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setVisibleCount(INITIAL_BATCH_SIZE);
    setShuffleSeed(Date.now());
    refreshLibraryData();
    await loadAllFeedPools(true);
    setTimeout(() => setRefreshing(false), 600);
  }, [loadAllFeedPools, refreshLibraryData]);

  useEffect(() => {
    const addTabPressListener = navigation.addListener as unknown as (
      eventName: "tabPress",
      listener: (event: { target?: string }) => void,
    ) => () => void;

    return addTabPressListener("tabPress", (event) => {
      if (!navigation.isFocused() || event.target !== route.key) return;

      scrollRef.current?.scrollTo({ y: 0, animated: true });
      onRefresh();
    });
  }, [navigation, onRefresh, route.key]);

  // Filter Past Papers by user interests
  const followedTeacherIdSet = useMemo(
    () =>
      new Set([
        ...followedTeacherIds,
        ...(profile?.followedTeacherIds ?? []),
      ]),
    [followedTeacherIds, profile?.followedTeacherIds],
  );

  const filteredPaperCollections = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return paperCollections;

    return paperCollections
      .map((section) => ({
        ...section,
        items: section.items.filter((paper) =>
          (paper.owner && followedTeacherIdSet.has(paper.owner)) ||
          matchesUserInterests(paper.subject, profile?.subjects),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [followedTeacherIdSet, paperCollections, profile]);

  const allPastPaperItems = useMemo<PaperItem[]>(() => {
    return filteredPaperCollections.flatMap((sec) => sec.items);
  }, [filteredPaperCollections]);

  // Filter other pools by user interests
  const filterByInterestsActive = shouldFilterByInterests(profile);

  const filteredTeacherPosts = useMemo(() => {
    return teacherPosts.filter((post) => {
      const isFromFollowedTeacher = Boolean(
        post.owner && followedTeacherIdSet.has(post.owner),
      );
      // Followed teachers remain visible with interest filtering enabled;
      // preference-matching posts from other teachers remain eligible too.
      return (
        isFromFollowedTeacher ||
        !filterByInterestsActive ||
        matchesUserInterests(post.subject, profile?.subjects)
      );
    });
  }, [
    filterByInterestsActive,
    followedTeacherIdSet,
    profile?.subjects,
    teacherPosts,
  ]);

  const filteredVideoLessons = useMemo(() => {
    if (!filterByInterestsActive) return videoLessons;
    return videoLessons.filter(
      (lesson) =>
        (lesson.owner && followedTeacherIdSet.has(lesson.owner)) ||
        matchesUserInterests(lesson.subject, profile?.subjects),
    );
  }, [filterByInterestsActive, followedTeacherIdSet, profile?.subjects, videoLessons]);

  const filteredFeaturedNotes = useMemo(() => {
    if (!filterByInterestsActive) return featuredNotes;
    return featuredNotes.filter(
      (note) =>
        (note.owner && followedTeacherIdSet.has(note.owner)) ||
        matchesUserInterests(note.subject, profile?.subjects),
    );
  }, [filterByInterestsActive, featuredNotes, followedTeacherIdSet, profile?.subjects]);

  const filteredBooks = useMemo(() => {
    if (!filterByInterestsActive) return books;
    return books.filter(
      (book) =>
        (book.owner && followedTeacherIdSet.has(book.owner)) ||
        matchesUserInterests(book.subject || book.title, profile?.subjects),
    );
  }, [books, filterByInterestsActive, followedTeacherIdSet, profile?.subjects]);

  // Generate Break Items (Carousels)
  const breakModules: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [
      {
        kind: "break",
        id: "break-courses",
        type: "courses",
        render: () => <CoursesCarousel />,
      },
      {
        kind: "break",
        id: "break-books",
        type: "books",
        render: () => <BookCarousel />,
      },
    ];

    filteredPaperCollections.forEach((section) => {
      const paperType = section.type.trim() || "Other";
      const paperYear = section.year.trim();

      items.push({
        kind: "break",
        id: `break-papers-${paperType}-${paperYear}`,
        type: "papers",
        render: () => (
          <View style={styles.breakSection}>
            <SectionHeader
              title={section.title}
              onSeeAll={() =>
                router.push({
                  pathname: "/see-all",
                  params: {
                    type: "papers",
                    paperType,
                    ...(paperYear ? { paperYear } : {}),
                  },
                } as any)
              }
              actionLabel="See all"
            />
            <PaperCarousel items={section.items} />
          </View>
        ),
      });
    });

    return items;
  }, [filteredPaperCollections, router]);

  // Interleave and randomize individual items into a continuous social feed!
  const feedItems = useMemo<FeedItem[]>(() => {
    const teacherItems: FeedItem[] = filteredTeacherPosts.map((post) => ({
      kind: "teacherPost",
      id: `teacher-${post.id}`,
      data: post,
      subject: post.subject,
    }));

    const videoItems: FeedItem[] = filteredVideoLessons.map((lesson) => ({
      kind: "videoLesson",
      id: `video-${lesson.id}`,
      data: lesson,
      subject: lesson.subject,
    }));

    const noteItems: FeedItem[] = filteredFeaturedNotes.map((note) => ({
      kind: "featuredNote",
      id: `note-${note.id}`,
      data: note,
      subject: Array.isArray(note.subject) ? note.subject[0] : note.subject,
    }));

    const bookItems: FeedItem[] = filteredBooks.map((book) => ({
      kind: "book",
      id: `book-${book.id}`,
      data: book,
      subject: book.subject,
    }));

    const paperItems: FeedItem[] = allPastPaperItems.map((paper, idx) => ({
      kind: "paper",
      id: `paper-${paper.id || idx}`,
      data: paper,
      subject: paper.subject,
    }));

    return interleaveFeedItems<FeedItem>({
      buckets: [
        { type: "teacherPost", items: teacherItems, weight: 2 },
        { type: "videoLesson", items: videoItems, weight: 2 },
        { type: "featuredNote", items: noteItems, weight: 2 },
        { type: "book", items: bookItems, weight: 1.2 },
        { type: "paper", items: paperItems, weight: 1.2 },
      ],
      seed: shuffleSeed,
      getItemType: (item) => item.kind,
      getItemSubject: (item) =>
        item.kind !== "break" ? item.subject : undefined,
      breakItems: breakModules,
      breakInterval: 6,
    });
  }, [
    filteredTeacherPosts,
    filteredVideoLessons,
    filteredFeaturedNotes,
    filteredBooks,
    allPastPaperItems,
    shuffleSeed,
    breakModules,
  ]);

  // Scroll handler for incremental batch loading
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 400;
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
      }, 250);
    }
  };

  if (showLoading || !authCheckReady) {
    return <LoadingScreen />;
  }

  if (Platform.OS === "web" && !authUser) {
    return <PublicHome />;
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

            {/* Daily Learning Streak Card */}
            {/* <StreakCard /> */}

            {/* Story-style topical discovery slider always at top */}
            <View style={styles.storiesSection}>
              <TopicalNotesSlider />
            </View>

            {/* Continue Learning Shelf when user has active page progress */}
            <ContinueLearningShelf />

            {/* Continuous Interleaved Social Feed */}
            {visibleFeed.map((item, idx) => {
              if (item.kind === "teacherPost") {
                return (
                  <View key={item.id} style={styles.feedCardWrapper}>
                    <TeacherPostItem
                      postItem={item.data}
                      index={idx}
                      teacherAvatars={teacherMeta.teacherAvatars}
                      ownerProfiles={teacherMeta.ownerProfiles}
                      defaultUserAvatar={teacherMeta.defaultUserAvatar}
                      isVisible
                    />
                  </View>
                );
              }

              if (item.kind === "videoLesson") {
                return (
                  <View key={item.id} style={styles.feedCardWrapper}>
                    <VideoCard item={item.data} index={idx} isGrid={false} />
                  </View>
                );
              }

              if (item.kind === "featuredNote") {
                return (
                  <View key={item.id} style={styles.feedCardWrapper}>
                    <FeaturedNoteItem
                      note={item.data}
                      subjectAvatars={notesMeta.subjectAvatars}
                      defaultAvatar={notesMeta.defaultAvatar}
                      source="home"
                      isVisible
                    />
                  </View>
                );
              }

              if (item.kind === "book") {
                return (
                  <View key={item.id} style={styles.feedCardWrapper}>
                    <View style={styles.itemHeaderBadge}>
                      <Text
                        style={[
                          styles.itemBadgeText,
                          { color: themeColors.primary },
                        ]}
                      >
                        Textbook{" "}
                        {item.data.subject ? `• ${item.data.subject}` : ""}
                      </Text>
                    </View>
                    <BookCard
                      item={{
                        id: item.data.id,
                        title: item.data.title,
                        author: item.data.author,
                        description: item.data.subject || "Textbook resource",
                        image: item.data.image,
                        owner: item.data.owner,
                      }}
                      width="100%"
                      marginRight={0}
                      onPress={() => {
                        if (auth.currentUser?.uid) {
                          recordUserActivity(
                            auth.currentUser.uid,
                            "book",
                            item.data.id,
                          );
                        }
                        router.push({
                          pathname: "/book-preview",
                          params: {
                            id: item.data.id,
                            source: "home",
                            returnTo: "/",
                          },
                        } as any);
                      }}
                    />
                  </View>
                );
              }

              if (item.kind === "paper") {
                return (
                  <View key={item.id} style={styles.feedCardWrapper}>
                    <View style={styles.itemHeaderBadge}>
                      <Text
                        style={[
                          styles.itemBadgeText,
                          { color: themeColors.primary },
                        ]}
                      >
                        Past Exam Paper{" "}
                        {item.data.year ? `• ${item.data.year}` : ""}
                      </Text>
                    </View>
                    <PaperCard
                      id={item.data.id}
                      title={item.data.title}
                      subject={item.data.subject}
                      year={item.data.year}
                      image={item.data.image}
                      document={item.data.document}
                      description={item.data.description}
                      level={item.data.level}
                      pageNumber={item.data.pageNumber}
                      paperCode={item.data.paperCode}
                      paperNumber={item.data.paperNumber}
                      owner={item.data.owner}
                      width="100%"
                      marginRight={0}
                    />
                  </View>
                );
              }

              if (item.kind === "break") {
                return (
                  <View key={item.id} style={styles.breakWrapper}>
                    {item.render()}
                  </View>
                );
              }

              return null;
            })}

            {/* Inline Lazy Loading & End Footer */}
            <View style={styles.feedFooter}>
              {loadingMore ? (
                <View
                  style={styles.loaderWrap}
                  accessibilityLabel="Loading more feed resources"
                >
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} style={styles.loaderSkeleton} />
                  ))}
                </View>
              ) : isAllLoaded && feedItems.length > 0 ? (
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
  storiesSection: {
    marginBottom: spacing.md,
  },
  feedCardWrapper: {
    marginBottom: spacing.lg,
  },
  breakWrapper: {
    marginVertical: spacing.md,
  },
  breakSection: {
    marginBottom: spacing.md,
  },
  itemHeaderBadge: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  itemBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  loaderSkeleton: {
    width: "100%",
    height: 72,
    borderRadius: 12,
  },
  endText: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
