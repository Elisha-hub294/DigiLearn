import { Feather as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNavigation, useRoute } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
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
import {
  FeaturedNoteCard,
  FeaturedNoteItem,
  loadFeaturedNotes,
  loadFeaturedNotesMetadata,
  TopicalNote,
} from "../../components/home/FeaturedNoteCard";
import { fetchPastPaperTypes } from "../../components/library/add-item/firebaseService";
import { BookCard } from "../../components/library/BookCard";
import { HeroBookCarousel } from "../../components/library/HeroBookCarousel";
import { PaperCard } from "../../components/library/PaperCard";
import { PaperCarousel } from "../../components/library/PaperCarousel";
import { Header } from "../../components/ui/Header";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  getHorizontalPadding,
  getTabContentWidth,
} from "../../constants/layout";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PaperItem,
  PaperSection,
  useLibraryData,
} from "../../hooks/useLibraryData";
import { recordUserActivity } from "../../services/activityService";
import { BookRecord, loadBooks } from "../../services/booksService";
import {
  interleaveFeedItems,
  shuffleWithSeed,
} from "../../utils/feedAlgorithm";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";

type LibraryCategory = {
  key: string;
  label: string;
  paperType?: string;
  icon?: keyof typeof Icon.glyphMap;
};

const baseCategories: LibraryCategory[] = [
  { key: "all", label: "All", icon: "list" },
  { key: "pages", label: "Pages", icon: "file-text" },
  { key: "books", label: "Books", paperType: "books", icon: "book" },
  { key: "other", label: "Other", paperType: "", icon: "more-horizontal" },
];

const yearNumber = (year: string) => {
  const value = Number.parseInt(year, 10);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
};

type LibraryFeedItem =
  | { kind: "page"; id: string; data: TopicalNote; subject?: string }
  | { kind: "book"; id: string; data: BookRecord; subject?: string }
  | { kind: "paper"; id: string; data: PaperItem; subject?: string };

export default function LibraryScreen() {
  const { colors: themeColors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const {
    loading: libraryLoading,
    refreshing,
    heroSlides,
    paperCollections,
    onRefresh: refreshLibraryData,
  } = useLibraryData();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pastPaperCategories, setPastPaperCategories] = useState<
    LibraryCategory[]
  >([]);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const scrollRef = useRef<ScrollView>(null);

  // Raw Content Pools for Library Feed
  const [pages, setPages] = useState<TopicalNote[]>([]);
  const [notesMeta, setNotesMeta] = useState<{
    subjectAvatars: Record<string, string>;
    defaultAvatar: string;
  }>({ subjectAvatars: {}, defaultAvatar: "" });
  const [books, setBooks] = useState<BookRecord[]>([]);

  // Infinite Scroll & Lazy Loading Pagination State
  const INITIAL_BATCH_SIZE = 8;
  const BATCH_INCREMENT = 6;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPools = useCallback(async (force = false) => {
    try {
      const [fetchedPages, nMeta, fetchedBooks] = await Promise.all([
        loadFeaturedNotes(),
        loadFeaturedNotesMetadata(),
        loadBooks(force),
      ]);
      setPages(fetchedPages);
      setNotesMeta(nMeta);
      setBooks(fetchedBooks);
    } catch (err) {
      console.warn("Could not load library feed pools", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadPools();
    });
    return () => {
      active = false;
    };
  }, [loadPools]);

  const onRefresh = useCallback(async () => {
    setShuffleSeed(Date.now());
    setVisibleCount(INITIAL_BATCH_SIZE);
    refreshLibraryData();
    await loadPools(true);
  }, [loadPools, refreshLibraryData]);

  const handleTabPress = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    const addTabPressListener = navigation.addListener as unknown as (
      eventName: "tabPress",
      listener: (event: { target?: string }) => void,
    ) => () => void;

    return addTabPressListener("tabPress", (event) => {
      if (navigation.isFocused() && event.target === route.key)
        handleTabPress();
    });
  }, [handleTabPress, navigation, route.key]);

  useEffect(() => {
    let isMounted = true;

    const loadPastPaperCategories = async () => {
      const paperTypes = await fetchPastPaperTypes();
      if (!isMounted) return;

      const firestoreCategories = paperTypes
        .map((paperType) => {
          const label = paperType.name.trim();
          const key = label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          return {
            key: key || "other",
            label,
            paperType: label,
            icon: "file-text" as const,
          };
        })
        .filter((item) => item.label);

      setPastPaperCategories(shuffleWithSeed(firestoreCategories, shuffleSeed));
    };

    loadPastPaperCategories();
    return () => {
      isMounted = false;
    };
  }, [shuffleSeed]);

  const categories = useMemo(
    () => [
      ...baseCategories.filter(
        (category) => category.key === "all" || category.key === "pages",
      ),
      ...pastPaperCategories,
      ...baseCategories.filter(
        (category) => category.key === "books" || category.key === "other",
      ),
    ],
    [pastPaperCategories],
  );

  const horizontalPadding = getHorizontalPadding(width);
  const tabContentWidth = getTabContentWidth(width);
  const contentMaxWidth = Math.min(
    1100,
    tabContentWidth - horizontalPadding * 2,
  );

  // Interest filtered collections
  const filterActive = shouldFilterByInterests(profile);

  const filteredPaperCollections = useMemo<PaperSection[]>(() => {
    const category = categories.find((item) => item.key === selectedCategory);
    if (!category) return [];

    let collections: PaperSection[];

    if (selectedCategory === "all") {
      collections = [...paperCollections];
    } else if (selectedCategory === "other") {
      collections = paperCollections.filter(
        (section) => !(section.type ?? "").trim(),
      );
    } else {
      collections = paperCollections.filter(
        (section) =>
          (section.type ?? "").trim().toLowerCase() ===
          (category.paperType ?? "").toLowerCase(),
      );
    }

    if (filterActive) {
      collections = collections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            matchesUserInterests(item.subject || item.title, profile?.subjects),
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    return collections.sort((a, b) => yearNumber(b.year) - yearNumber(a.year));
  }, [
    categories,
    selectedCategory,
    paperCollections,
    filterActive,
    profile?.subjects,
  ]);

  const allPastPaperItems = useMemo<PaperItem[]>(() => {
    return filteredPaperCollections.flatMap((sec) => sec.items);
  }, [filteredPaperCollections]);

  const filteredPages = useMemo(() => {
    if (!filterActive) return pages;
    return pages.filter((page) =>
      matchesUserInterests(page.subject, profile?.subjects),
    );
  }, [filterActive, pages, profile?.subjects]);

  const filteredBooks = useMemo(() => {
    if (!filterActive) return books;
    return books.filter((book) =>
      matchesUserInterests(book.subject || book.title, profile?.subjects),
    );
  }, [books, filterActive, profile?.subjects]);

  // Interleaved Library Discovery Feed for "All" view
  const libraryFeedItems = useMemo<LibraryFeedItem[]>(() => {
    const pageItems: LibraryFeedItem[] = filteredPages.map((page) => ({
      kind: "page",
      id: `page-${page.id}`,
      data: page,
      subject: Array.isArray(page.subject) ? page.subject[0] : page.subject,
    }));

    const bookItems: LibraryFeedItem[] = filteredBooks.map((book) => ({
      kind: "book",
      id: `book-${book.id}`,
      data: book,
      subject: book.subject,
    }));

    const paperItems: LibraryFeedItem[] = allPastPaperItems.map(
      (paper, idx) => ({
        kind: "paper",
        id: `paper-${paper.id || idx}`,
        data: paper,
        subject: paper.subject,
      }),
    );

    return interleaveFeedItems<LibraryFeedItem>({
      buckets: [
        { type: "page", items: pageItems, weight: 2 },
        { type: "book", items: bookItems, weight: 1.4 },
        { type: "paper", items: paperItems, weight: 1.4 },
      ],
      seed: shuffleSeed,
      getItemType: (item) => item.kind,
      getItemSubject: (item) => item.subject,
    });
  }, [filteredPages, filteredBooks, allPastPaperItems, shuffleSeed]);

  // Shuffled books for "books" category view
  const shuffledCategoryBooks = useMemo(() => {
    return shuffleWithSeed(filteredBooks, shuffleSeed);
  }, [filteredBooks, shuffleSeed]);

  // Handle Scroll-Triggered Lazy Loading
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 400;
    const isNearEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (
      isNearEnd &&
      !loadingMore &&
      selectedCategory === "all" &&
      visibleCount < libraryFeedItems.length
    ) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) =>
          Math.min(prev + BATCH_INCREMENT, libraryFeedItems.length),
        );
        setLoadingMore(false);
      }, 250);
    }
  };

  const visibleLibraryFeed = useMemo(() => {
    return libraryFeedItems.slice(0, visibleCount);
  }, [libraryFeedItems, visibleCount]);

  const isAllLoaded = visibleCount >= libraryFeedItems.length;

  if (libraryLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      >
        <View
          style={[
            styles.skeletonContent,
            { paddingHorizontal: horizontalPadding, maxWidth: contentMaxWidth },
          ]}
        >
          <Skeleton style={styles.skeletonHeader} />
          <Skeleton style={styles.skeletonSearch} />
          <Skeleton style={styles.skeletonHero} />
          <View style={styles.skeletonCategoryRow}>
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} style={styles.skeletonCategory} />
            ))}
          </View>
          <View style={styles.skeletonCards}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <Skeleton style={styles.skeletonCardImage} />
                <Skeleton style={styles.skeletonCardTitle} />
                <Skeleton style={styles.skeletonCardLine} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <View style={[styles.page, { maxWidth: contentMaxWidth }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={[3]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
            />
          }
        >
          <Animated.View
            entering={FadeInUp.duration(320)}
            style={styles.headerWrap}
          >
            <Header
              title="Library"
              rightIconName="book-open"
              showDownloadsButton
              notificationTypes={["book", "page", "paper"]}
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(360)}>
            <SearchBar placeholder=" Search in Library" source="library" />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400)}>
            <HeroBookCarousel data={heroSlides} />
          </Animated.View>

          {/* Sticky Category Tabs Bar */}
          <Animated.View
            entering={FadeInUp.duration(440)}
            style={[
              styles.filterSection,
              styles.stickyFilter,
              { backgroundColor: themeColors.background },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {categories.map((category) => {
                const isSelected = category.key === selectedCategory;
                return (
                  <Pressable
                    key={category.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${category.label}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSelectedCategory(category.key);
                      setVisibleCount(INITIAL_BATCH_SIZE);
                    }}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      {
                        backgroundColor: themeColors.white,
                        borderColor: themeColors.border,
                      },
                      isSelected && styles.categoryChipSelected,
                      pressed && styles.categoryChipPressed,
                    ]}
                  >
                    <Icon
                      name={category.icon ?? "file-text"}
                      size={15}
                      color={
                        isSelected ? themeColors.white : themeColors.inactive
                      }
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        {
                          color: isSelected
                            ? themeColors.white
                            : themeColors.text,
                        },
                        isSelected && styles.categoryLabelSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Dynamic Feed / Category View */}
          <Animated.View
            entering={FadeInUp.duration(480)}
            style={styles.section}
          >
            {selectedCategory === "all" ? (
              // Social-style discovery stream of Pages, Books, and Past Exam Papers!
              <>
                {visibleLibraryFeed.map((item) => {
                  if (item.kind === "page") {
                    return (
                      <View key={item.id} style={styles.feedCardWrapper}>
                        <View style={styles.badgeRow}>
                          <Text
                            style={[
                              styles.badgeText,
                              { color: themeColors.primary },
                            ]}
                          >
                            Pages{" "}
                            {item.data.subject ? `• ${item.data.subject}` : ""}
                          </Text>
                        </View>
                        <FeaturedNoteItem
                          note={item.data}
                          subjectAvatars={notesMeta.subjectAvatars}
                          defaultAvatar={notesMeta.defaultAvatar}
                          source="library"
                          isVisible
                        />
                      </View>
                    );
                  }

                  if (item.kind === "book") {
                    return (
                      <View key={item.id} style={styles.feedCardWrapper}>
                        <View style={styles.badgeRow}>
                          <Text
                            style={[
                              styles.badgeText,
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
                            description:
                              item.data.subject || "Textbook resource",
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
                                source: "library",
                                returnTo: "/library",
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
                        <View style={styles.badgeRow}>
                          <Text
                            style={[
                              styles.badgeText,
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

                  return null;
                })}

                {/* Inline Lazy Loading & End Footer */}
                <View style={styles.feedFooter}>
                  {loadingMore ? (
                    <View style={styles.loaderWrap}>
                      {[0, 1].map((item) => (
                        <Skeleton key={item} style={styles.loaderSkeleton} />
                      ))}
                    </View>
                  ) : isAllLoaded && libraryFeedItems.length > 0 ? (
                    <Text
                      style={[styles.endText, { color: themeColors.subtitle }]}
                    >
                      You&apos;ve seen all library resources! ✨
                    </Text>
                  ) : null}
                </View>
              </>
            ) : selectedCategory === "pages" ? (
              <FeaturedNoteCard source="library" />
            ) : selectedCategory === "books" ? (
              <View style={styles.booksCategoryView}>
                <View style={styles.bookContainer}>
                  <BookCarousel />
                </View>
                <View style={{ marginTop: spacing.lg }}>
                  <SectionHeader title="All Textbooks" actionLabel="" />
                  {shuffledCategoryBooks.map((book) => (
                    <View
                      key={`cat-book-${book.id}`}
                      style={styles.feedCardWrapper}
                    >
                      <BookCard
                        item={{
                          id: book.id,
                          title: book.title,
                          author: book.author,
                          description: book.subject || "Textbook resource",
                          image: book.image,
                          owner: book.owner,
                        }}
                        width="100%"
                        marginRight={0}
                        onPress={() => {
                          if (auth.currentUser?.uid) {
                            recordUserActivity(
                              auth.currentUser.uid,
                              "book",
                              book.id,
                            );
                          }
                          router.push({
                            pathname: "/book-preview",
                            params: {
                              id: book.id,
                              source: "library",
                              returnTo: "/library",
                            },
                          } as any);
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : filteredPaperCollections.length ? (
              filteredPaperCollections.map((section) => (
                <View
                  key={`${section.type}-${section.year}`}
                  style={styles.paperSection}
                >
                  <SectionHeader
                    title={section.title}
                    onSeeAll={() =>
                      router.push({
                        pathname: "/see-all",
                        params: {
                          type: "papers",
                          paperType: section.type,
                          paperYear: section.year,
                        },
                      } as any)
                    }
                    actionLabel="See all"
                  />
                  <PaperCarousel items={section.items} />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="file-text" size={24} color={colors.subtitle} />
                <Text style={styles.emptyTitle}>No past papers available</Text>
                <Text style={styles.emptySubtitle}>
                  There are currently no items available in this category.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, width: "100%", alignSelf: "center" },
  scrollView: { flex: 1 },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  headerWrap: { marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  filterSection: { marginTop: spacing.md, marginBottom: spacing.lg },
  stickyFilter: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
  },
  filterContent: { gap: spacing.sm, paddingRight: spacing.lg },
  activeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  activeFilterText: { fontSize: 12, fontWeight: "600" },
  clearFilterButton: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  clearFilterText: { fontSize: 12, fontWeight: "700" },
  categoryChip: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "#A8A8A8",
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipPressed: { opacity: 0.78 },
  categoryLabel: { color: "#4B5563", fontSize: 14, fontWeight: "600" },
  categoryLabelSelected: { color: colors.white },
  paperSection: { marginBottom: spacing.xl },
  bookContainer: { marginTop: spacing.sm },
  booksCategoryView: { width: "100%" },
  feedCardWrapper: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: {
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
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.lightBackground,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  skeletonContent: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    width: "100%",
    alignSelf: "center",
  },
  skeletonHeader: {
    width: 140,
    height: 34,
    backgroundColor: "#ECECEC",
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  skeletonSearch: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    marginBottom: spacing.lg,
  },
  skeletonHero: {
    height: 190,
    borderRadius: radius.xl,
    backgroundColor: "#F3F4F6",
    marginBottom: spacing.xl,
  },
  skeletonCategoryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skeletonCategory: {
    width: 72,
    height: 36,
    borderRadius: radius.pill,
  },
  skeletonCards: {
    gap: spacing.md,
  },
  skeletonCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  skeletonCardImage: {
    width: "100%",
    height: 140,
    borderRadius: radius.xl,
  },
  skeletonCardTitle: {
    width: "68%",
    height: 16,
  },
  skeletonCardLine: {
    width: "42%",
    height: 12,
  },
});
