import { Feather as Icon } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookCarousel } from "@/components/home/BookCarousel";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { AddItemModal, FormType } from "../components/library/AddItemModal";
import { HeroBookCarousel } from "../components/library/HeroBookCarousel";
import { PaperCarousel } from "../components/library/PaperCarousel";
import { PromotionalBanner } from "../components/library/PromotionalBanner";
import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { colors, radius, spacing } from "../constants/theme";
import { useLibraryData } from "../hooks/useLibraryData";

const getHorizontalPadding = (width: number) => {
  if (width >= 1200) return 150;
  if (width >= 900) return 50;
  if (width >= 600) return 30;
  if (width >= 400) return 5;
  return 5;
};

export default function LibraryScreen() {
  const { width } = useWindowDimensions();
  const {
    loading,
    refreshing,
    heroSlides,
    topBooks,
    promos,
    paperCollections,
    loadLibraryData,
    onRefresh,
  } = useLibraryData();

  const [shuffleSeed, setShuffleSeed] = useState(0);

  const shuffledPromos = useMemo(() => {
    const shuffled = [...promos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [shuffleSeed, promos]);

  const shuffledPaperCollections = useMemo(() => {
    const shuffled = [...paperCollections];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [shuffleSeed, paperCollections]);

  const pageSections = useMemo(
    () => [
      {
        key: "featuredNote",
        content: <FeaturedNoteCard />,
      },
      {
        key: "books",
        content: (
          <>
            <SectionHeader
              title="Books"
              onSeeAll={() => {}}
              actionLabel="See all"
            />
            <BookCarousel />
          </>
        ),
      },
      ...shuffledPromos.map((promo, index) => ({
        key: `promo-${promo.title}-${index}`,
        content: <PromotionalBanner {...promo} />,
      })),
      ...shuffledPaperCollections.map((section, index) => ({
        key: `collection-${section.title}-${index}`,
        content: (
          <>
            <SectionHeader
              title={section.title}
              onSeeAll={() => {}}
              actionLabel="See all"
            />
            <PaperCarousel items={section.items} />
          </>
        ),
      })),
    ],
    [shuffledPaperCollections, shuffledPromos],
  );

  const shuffledSections = useMemo(() => {
    const shuffled = [...pageSections];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [pageSections, shuffleSeed]);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<FormType>("book");

  const openForm = (type: FormType) => {
    setFormType(type);
    setShowModal(true);
  };

  const handleRefresh = () => {
    setShuffleSeed((prev) => prev + 1);
    onRefresh();
  };

  if (loading) {
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
          <View style={styles.skeletonGrid} />
        </View>
      </SafeAreaView>
    );
  }

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
              onRefresh={handleRefresh}
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

          {shuffledSections.map((section, index) => (
            <Animated.View
              key={section.key}
              entering={FadeInUp.duration(480 + index * 40)}
              style={styles.section}
            >
              {section.content}
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Floating Action Buttons */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a new book"
        style={styles.fab}
        onPress={() => openForm("book")}
      >
        <Icon name="plus" size={24} color={colors.white} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a new page"
        style={styles.fabSecondary}
        onPress={() => openForm("page")}
      >
        <Icon name="file-text" size={22} color={colors.white} />
      </Pressable>

      {/* Modal */}
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    textTransform: "capitalize",
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
    height: 98,
    borderRadius: radius.xl,
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
