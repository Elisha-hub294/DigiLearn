import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
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
import { colors, spacing } from "../constants/theme";
import LoadingScreen from "./loading";

const getHorizontalPadding = (width: number) => {
  if (width >= 1200) return 150;
  if (width >= 900) return 50;
  if (width >= 600) return 30;
  if (width >= 400) return 5;
  return 5;
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  // Seed to trigger reshuffle on refresh
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Increment seed to reshuffle sections on refresh
    setShuffleSeed((prev) => prev + 1);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  // Define sections to display
  const sections = useMemo(
    () => [
      {
        key: "featuredNote",
        content: <FeaturedNoteCard />,
      },
      {
        key: "teacherPost",
        content: <TeacherPostCard />,
      },
      {
        key: "popularCourses",
        content: (
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
        key: "books",
        content: (
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

  const shuffledSections = useMemo(() => {
    const shuffled = [...sections];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [shuffleSeed, sections]);

  if (showLoading) {
    return <LoadingScreen />;
  }

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
            {/* 
            <Animated.View
              entering={FadeInUp.duration(470)}
              style={styles.section}
            >
              <HeroCarousel />
            </Animated.View> */}

            <Animated.View
              entering={FadeInUp.duration(450)}
              style={styles.section}
            >
              {/* <SectionHeader
                title="Topical notes"
                onSeeAll={() => router.push("/library")}
              /> */}
              <TopicalNotesSlider />
            </Animated.View>

            {shuffledSections.map((section, idx) => (
              <Animated.View
                key={section.key}
                entering={FadeInUp.duration(500 + idx * 50)}
                style={styles.section}
              >
                {section.content}
              </Animated.View>
            ))}
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
  stack: {
    width: "100%",
    gap: spacing.sm,
  },
  gradientContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  gradientTextBlock: {
    flex: 1,
    minWidth: 220,
  },
  gradientEyebrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  gradientTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 8,
  },
  gradientBody: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 20,
  },
  gradientButton: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  gradientButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
