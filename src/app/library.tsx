import { Feather as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { AddItemModal, FormType } from "../components/library/AddItemModal";
import { CategorySlider } from "../components/library/CategorySlider";
import { HeroBookCarousel } from "../components/library/HeroBookCarousel";
import { PaperCarousel } from "../components/library/PaperCarousel";
import { PromotionalBanner } from "../components/library/PromotionalBanner";
import { TopSellingBooks } from "../components/library/TopSellingBooks";
import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { colors, dimensions, radius, spacing } from "../constants/theme";
import { useLibraryData } from "../hooks/useLibraryData";

const CATEGORIES = [
  {
    id: "pages",
    label: "Pages",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/pages-2d.png",
  },
  {
    id: "uneb",
    label: "UNEB",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/uneb-2d.png",
  },
  {
    id: "mock",
    label: "MOCK",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/exam-2d.png",
  },
  {
    id: "umta",
    label: "UMTA",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/umta-2d.png",
  },
  {
    id: "exam",
    label: "Exam",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/exam-2d.png",
  },
  {
    id: "test",
    label: "Test",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/exam-2d.png",
  },
  {
    id: "buganda",
    label: "Buganda",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/exam-2d.png",
  },
  {
    id: "jinja",
    label: "Jinja",
    icon: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/exam-2d.png",
  },
];

export default function LibraryScreen() {
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

  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<FormType>("book");

  const openForm = (type: FormType) => {
    setFormType(type);
    setShowModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skeletonContent}>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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

        <Animated.View entering={FadeInUp.duration(440)} style={styles.section}>
          <SectionHeader
            title="Categories"
            onSeeAll={() => {}}
            actionLabel=""
          />
          <CategorySlider items={CATEGORIES} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(480)} style={styles.section}>
          <SectionHeader
            title="Featured notes"
            onSeeAll={() => {}}
            actionLabel="More"
          />
          <FeaturedNoteCard layout="two-column" />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(560)} style={styles.section}>
          <SectionHeader
            title="Text Books"
            onSeeAll={() => {}}
            actionLabel="See all"
          />
          <TopSellingBooks items={topBooks} />
        </Animated.View>

        {promos[0] && (
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.section}
          >
            <PromotionalBanner {...promos[0]} />
          </Animated.View>
        )}

        {paperCollections.map((section, index) => (
          <Animated.View
            key={`${section.title}-${index}`}
            entering={FadeInUp.duration(640 + index * 40)}
            style={styles.section}
          >
            <SectionHeader
              title={section.title}
              onSeeAll={() => {}}
              actionLabel="See all"
            />
            <PaperCarousel items={section.items} />
          </Animated.View>
        ))}

        {promos.slice(1).map((promo, index) => (
          <Animated.View
            key={`${promo.title}-${index}`}
            entering={FadeInUp.duration(760 + index * 40)}
            style={styles.section}
          >
            <PromotionalBanner {...promo} />
          </Animated.View>
        ))}
      </ScrollView>

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
        accessibilityLabel="Add a new past paper"
        style={styles.fabSecondary}
        onPress={() => openForm("paper")}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: dimensions.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    maxWidth: Math.min(1120, dimensions.width - 32),
    alignSelf: "center",
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
    backgroundColor: "#ec4899",
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
    paddingHorizontal: dimensions.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
