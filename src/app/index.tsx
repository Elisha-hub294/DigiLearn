import HeroCarousel from "@/components/ui/HeroCarousel";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { BookCarousel } from "../components/home/BookCarousel";
import { CoursesCarousel } from "../components/home/CoursesCarousel";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { TeacherPostCard } from "../components/home/TeacherPostCard";
import { TopicalNotesSlider } from "../components/home/TopicalNotesSlider";
import { UnebCard } from "../components/home/UnebCard";
import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { colors, spacing } from "../constants/theme";
import LoadingScreen from "./loading";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const isWideLayout = width >= 900;
  const horizontalPadding =
    width >= 1200
      ? 64
      : width >= 900
        ? 48
        : width >= 600
          ? 32
          : width >= 400
            ? 10
            : 5;
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

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

            <Animated.View
              entering={FadeInUp.duration(400)}
              style={styles.section}
            >
              {isWideLayout ? (
                <View style={styles.dualColumnLayout}>
                  <View style={styles.dualColumnItem}>
                    <FeaturedNoteCard />
                  </View>
                  <View style={styles.dualColumnItem}>
                    <TeacherPostCard />
                  </View>
                </View>
              ) : (
                <View style={styles.stack}>
                  <Animated.View
                    entering={FadeInUp.duration(400)}
                    style={styles.section}
                  >
                    <HeroCarousel />
                  </Animated.View>
                  <FeaturedNoteCard />
                  <TeacherPostCard />
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(450)}
              style={styles.section}
            >
              <SectionHeader
                title="Topical notes"
                onSeeAll={() => router.push("/library")}
              />
              <TopicalNotesSlider />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(550)}
              style={styles.section}
            >
              <SectionHeader
                title="Popular courses"
                onSeeAll={() => router.push("/videos")}
              />
              <CoursesCarousel />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(600)}
              style={styles.section}
            >
              <SectionHeader
                title="UNEB papers"
                onSeeAll={() => router.push("/library")}
              />
              <UnebCard />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(700)}
              style={styles.section}
            >
              <SectionHeader
                title="Textbooks"
                onSeeAll={() => router.push("/library")}
              />
              <BookCarousel />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(750)}
              style={styles.section}
            >
              <GradientAnnouncement />
            </Animated.View>
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const GradientAnnouncement = () => (
  <LinearGradient
    colors={["#3B82F6", "#f65cee"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gradientCard}
  >
    <View style={styles.gradientContent}>
      <View style={styles.gradientTextBlock}>
        <Text style={styles.gradientEyebrow}>Study sprint</Text>
        <Text style={styles.gradientTitle}>
          Stay consistent with your weekly plan
        </Text>
        <Text style={styles.gradientBody}>
          New revision prompts are published each day to keep your learning
          momentum strong.
        </Text>
      </View>
      <Pressable style={styles.gradientButton} accessibilityRole="button">
        <Text style={styles.gradientButtonText}>View plan</Text>
      </Pressable>
    </View>
  </LinearGradient>
);

const FooterIllustration = () => (
  <View style={styles.footerCard}>
    <Image
      source={require("../../assets/images/footer-home.png")}
      style={styles.footerImage}
      contentFit="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignSelf: "center",
    width: "100%",
  },
  section: {
    marginBottom: spacing.sm,
  },
  stack: {
    width: "100%",
  },
  dualColumnLayout: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  dualColumnItem: {
    flex: 1,
    minWidth: 0,
  },
  gradientCard: {
    borderRadius: 10,
    padding: spacing.lg,
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
  footerCard: {
    alignItems: "center",
  },
  footerImage: {
    width: "100%",
    maxWidth: 320,
    height: 180,
  },
});
