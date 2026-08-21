import { Feather as Icon } from "@expo/vector-icons";
import { useMemo, useState } from "react";
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
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { AddItemModal, FormType } from "../components/library/AddItemModal";
import { HeroBookCarousel } from "../components/library/HeroBookCarousel";
import { PaperCarousel } from "../components/library/PaperCarousel";
import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { PaperSection, useLibraryData } from "../hooks/useLibraryData";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../utils/interestFilter";

const categories = [
  { key: "pages", label: "Pages" },
  { key: "uneb", label: "UNEB", paperType: "uneb" },
  { key: "mock", label: "MOCK", paperType: "mock" },
  { key: "umta", label: "UMTA", paperType: "umta" },
  { key: "other", label: "Other", paperType: "" },
] as const;
type Category = (typeof categories)[number]["key"];
const yearNumber = (year: string) => {
  const value = Number.parseInt(year, 10);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
};

export default function LibraryScreen() {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const {
    loading,
    refreshing,
    heroSlides,
    paperCollections,
    loadLibraryData,
    onRefresh,
  } = useLibraryData();
  const [selectedCategory, setSelectedCategory] = useState<Category>("pages");
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<FormType>("book");
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const filteredPaperCollections = useMemo<PaperSection[]>(() => {
    const category = categories.find((item) => item.key === selectedCategory);
    if (!category || !("paperType" in category)) return [];
    
    let collections = paperCollections.filter(
      (section) =>
        section.type.trim().toLowerCase() === category.paperType.toLowerCase(),
    );

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

  if (loading)
    return (
      <SafeAreaView style={styles.safeArea}>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, { maxWidth: contentMaxWidth }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
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
        >
          <Animated.View
            entering={FadeInUp.duration(320)}
            style={styles.headerWrap}
          >
            <Header title="Library" rightIconName="book-open" />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(360)}>
            <SearchBar placeholder="Search by subject, title, etc" />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400)}>
            <HeroBookCarousel data={heroSlides} />
          </Animated.View>
          <Animated.View
            entering={FadeInUp.duration(440)}
            style={styles.filterSection}
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
                      name="file-text"
                      size={15}
                      color={isSelected ? colors.white : "#4B5563"}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
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
            ) : filteredPaperCollections.length ? (
              filteredPaperCollections.map((section) => (
                <View
                  key={`${section.type}-${section.year}`}
                  style={styles.paperSection}
                >
                  <SectionHeader
                    title={section.title}
                    onSeeAll={() => { }}
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a new book"
        style={styles.fab}
        onPress={() => {
          setFormType("book");
          setShowModal(true);
        }}
      >
        <Icon name="plus" size={24} color={colors.white} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a new page"
        style={styles.fabSecondary}
        onPress={() => {
          setFormType("page");
          setShowModal(true);
        }}
      >
        <Icon name="file-text" size={22} color={colors.white} />
      </Pressable>
      <AddItemModal
        visible={showModal}
        formType={formType}
        onClose={() => setShowModal(false)}
        onSuccess={loadLibraryData}
      />
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
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabSecondary: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl + 74,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
