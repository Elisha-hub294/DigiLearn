import { Feather as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNavigation, useRoute } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { BookCarousel } from "../../components/home/BookCarousel";
import { FeaturedNoteCard } from "../../components/home/FeaturedNoteCard";
import { fetchPastPaperTypes } from "../../components/library/add-item/firebaseService";
import { HeroBookCarousel } from "../../components/library/HeroBookCarousel";
import { PaperCarousel } from "../../components/library/PaperCarousel";
import { Header } from "../../components/ui/Header";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { PaperSection, useLibraryData } from "../../hooks/useLibraryData";
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

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

export default function LibraryScreen() {
  const { colors: themeColors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { loading, refreshing, heroSlides, paperCollections, onRefresh } =
    useLibraryData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pastPaperCategories, setPastPaperCategories] = useState<
    LibraryCategory[]
  >([]);
  const scrollRef = useRef<ScrollView>(null);

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
      if (event.target === route.key) handleTabPress();
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

      setPastPaperCategories(shuffle(firestoreCategories));
    };

    loadPastPaperCategories();
    return () => {
      isMounted = false;
    };
  }, []);

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
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
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

    if (shouldFilterByInterests(profile)) {
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
  }, [paperCollections, selectedCategory, profile]);

  const groupedPaperCollections = useMemo(() => {
    return categories
      .filter(
        (category) =>
          category.key !== "all" &&
          category.key !== "pages" &&
          category.key !== "books" &&
          Boolean((category.paperType ?? "").trim()),
      )
      .map((category) => {
        const collections = paperCollections
          .filter(
            (section) =>
              section.type.trim().toLowerCase() ===
              (category.paperType ?? "").toLowerCase(),
          )
          .sort((a, b) => yearNumber(b.year) - yearNumber(a.year));

        if (shouldFilterByInterests(profile)) {
          return {
            ...category,
            collections: collections
              .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                  matchesUserInterests(
                    item.subject || item.title,
                    profile?.subjects,
                  ),
                ),
              }))
              .filter((section) => section.items.length > 0),
          };
        }

        return { ...category, collections };
      })
      .filter((group) => group.collections.length > 0);
  }, [paperCollections, profile]);

  if (loading)
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
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonSearch} />
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonGrid} />
        </View>
      </SafeAreaView>
    );

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
              notificationTypes={["book", "page", "paper"]}
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(360)}>
            <SearchBar placeholder=" Search in Library" source="library" />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400)}>
            <HeroBookCarousel data={heroSlides} />
          </Animated.View>
          <Animated.View
            entering={FadeInUp.duration(440)}
            style={[styles.filterSection, styles.stickyFilter]}
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
                    onPress={() => setSelectedCategory(category.key)}
                    style={({ pressed }) => [
                      styles.categoryChip,
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
          <Animated.View
            entering={FadeInUp.duration(480)}
            style={styles.section}
          >
            {selectedCategory === "pages" ? (
              <FeaturedNoteCard source="library" />
            ) : selectedCategory === "books" ? (
              <View style={styles.bookContainer}>
                <BookCarousel />
              </View>
            ) : selectedCategory === "all" ? (
              <>
                <View style={styles.paperSection}>
                  <SectionHeader
                    title="Pages"
                    onSeeAll={() => router.push("/see-all?type=papers")}
                    actionLabel="See all"
                  />
                  <FeaturedNoteCard source="library" />
                </View>

                <View style={styles.bookContainer}>
                  <BookCarousel />
                </View>

                {groupedPaperCollections.map((group) => (
                  <View key={group.key} style={styles.paperSection}>
                    {group.collections.map((section) => (
                      <View
                        key={`${section.type}-${section.year}`}
                        style={styles.subSection}
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
                    ))}
                  </View>
                ))}
              </>
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
  subSection: { marginTop: spacing.md },
  sectionTitle: {
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
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
  skeletonRow: {
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "#F3F4F6",
    marginBottom: spacing.md,
  },
  skeletonGrid: {
    height: 140,
    borderRadius: radius.xl,
    backgroundColor: "#F3F4F6",
    marginBottom: spacing.md,
  },
});
