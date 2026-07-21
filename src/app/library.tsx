import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookListItem, BookListItemData } from "../components/ui/BookListItem";
import { PastPaperList } from "../components/ui/PastPaperList";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { ReadAboutGrid } from "../components/ui/ReadAboutGrid";
import { RecommendedBookCarousel } from "../components/ui/RecommendedBookCarousel";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SubjectChip } from "../components/ui/SubjectChip";
import { TeacherCarousel } from "../components/ui/TeacherCarousel";
import { YearDropdown } from "../components/ui/YearDropdown";
import {
  colors,
  dimensions,
  radius,
  shadows,
  spacing,
  typography,
} from "../constants/theme";

const topicData = [
  {
    id: "topic-1",
    title: "Quadratic Equations",
    description:
      "Master quadratic equations with worked examples and exam-style questions.",
    color: "#6C4DC9",
    icon: require("../../assets/images/math-2d.png"),
  },
  {
    id: "topic-2",
    title: "Writing a Professional CV",
    description:
      "Create impressive CVs and application letters for school and career success.",
    color: "#911A80",
    icon: require("../../assets/images/lang-2d.png"),
  },
  {
    id: "topic-3",
    title: "Ancient Civilizations",
    description:
      "Discover the rise of kingdoms, empires, and influential events.",
    color: "#D84B36",
    icon: require("../../assets/images/hist-2d.png"),
  },
  {
    id: "topic-4",
    title: "Oceans & Climate",
    description:
      "Learn about oceans, weather patterns, ecosystems and the Earth’s surface.",
    color: "#5E8E31",
    icon: require("../../assets/images/geo-2d.png"),
  },
  {
    id: "topic-5",
    title: "Creative Arts",
    description: "Explore drawing, painting, design and artistic creativity.",
    color: "#8049CF",
    icon: require("../../assets/images/art-2d.png"),
  },
  {
    id: "topic-6",
    title: "Economics Basics",
    description: "Understand supply, demand, inflation and economic decisions.",
    color: "#5E8E90",
    icon: require("../../assets/images/econ-2d.png"),
  },
  {
    id: "topic-7",
    title: "Business Innovation",
    description:
      "Learn entrepreneurship, startups and practical business planning.",
    color: "#29B2A9",
    icon: require("../../assets/images/ent-2d.png"),
  },
  {
    id: "topic-8",
    title: "Computer Fundamentals",
    description:
      "Programming, networking, productivity tools and digital literacy.",
    color: "#2AB2AA",
    icon: require("../../assets/images/ict-2d.png"),
  },
  {
    id: "topic-9",
    title: "Human Body Systems",
    description: "Study cells, organs, genetics and biological processes.",
    color: "#EA5E88",
    icon: require("../../assets/images/bio-2d.png"),
  },
  {
    id: "topic-10",
    title: "Chemical Reactions",
    description: "Understand atoms, reactions, techniques and calculations.",
    color: "#F9C624",
    icon: require("../../assets/images/chem-2d.png"),
  },
];

const teacherData = [
  {
    id: "teacher-1",
    name: "Grace Namusoke",
    subject: "Mathematics",
    school: "Kings College Budo",
    image: require("../../assets/images/tr-1.webp"),
    verified: true,
  },
  {
    id: "teacher-2",
    name: "John Okello",
    subject: "Biology",
    school: "Ntare School",
    image: require("../../assets/images/tr-default.png"),
  },
  {
    id: "teacher-3",
    name: "Sarah Atwine",
    subject: "Chemistry",
    school: "Gayaza High School",
    image: require("../../assets/images/tr-2.jpg"),
    verified: true,
  },
  {
    id: "teacher-4",
    name: "Peter Kato",
    subject: "Geography",
    school: "St. Mary’s College Kisubi",
    image: require("../../assets/images/tr-3.jpg"),
  },
];

const bookData = [
  {
    id: "book-1",
    title: "Mastering Algebra",
    description: "A clear, visual approach to equations and graphs.",
    author: "R. Ssemakula",
    rating: "★★★★★",
    subject: "Math",
    image: require("../../assets/images/book1.jpg"),
  },
  {
    id: "book-2",
    title: "Physics Essentials",
    description: "Concise notes for practical and theory questions.",
    author: "L. Okoth",
    rating: "★★★★★",
    subject: "Physics",
    image: require("../../assets/images/book2.png"),
  },
  {
    id: "book-3",
    title: "Chemistry Concepts",
    description: "A practical guide to reactions and lab work.",
    author: "D. Namuli",
    rating: "★★★★★",
    subject: "Chemistry",
    image: require("../../assets/images/book3.jpeg"),
  },
];

const moreBooksData: BookListItemData[] = [
  {
    id: "more-1",
    title: "Educated",
    description: "A powerful memoir on resilience, curiosity and growth.",
    author: "Tara Westover",
    subject: "Biography",
    image: require("../../assets/images/book4.png"),
  },
  {
    id: "more-2",
    title: "Harry Potter and the Philosopher’s Stone",
    description: "An imaginative journey into magic, friendship and courage.",
    author: "J. K. Rowling",
    subject: "Fiction",
    image: require("../../assets/images/book5.jpg"),
  },
  {
    id: "more-3",
    title: "Green Witchcraft",
    description:
      "A grounded introduction to herbal rituals and mindful practices.",
    author: "Ann Moura",
    subject: "Lifestyle",
    image: require("../../assets/images/book4.png"),
  },
  {
    id: "more-4",
    title: "Atomic Habits",
    description: "Build lasting habits with small daily improvements.",
    author: "James Clear",
    subject: "Self-Development",
    image: require("../../assets/images/book5.jpg"),
  },
  {
    id: "more-5",
    title: "Deep Work",
    description:
      "Learn to focus in a distracted world with meaningful practice.",
    author: "Cal Newport",
    subject: "Productivity",
    image: require("../../assets/images/book3.jpeg"),
  },
];

const chipData = [
  { id: "all", label: "All", active: true },
  { id: "uneb", label: "UNEB" },
  { id: "wakissha", label: "WAKISSHA" },
  { id: "umta", label: "UMTA" },
  { id: "mebu", label: "MEBU" },
  { id: "buganda", label: "BUGANDA" },
  { id: "wakata", label: "WAKATA" },
];

const paperData = [
  {
    id: "paper-1",
    title: "P425/1 Pure Mathematics (2025)",
    badge: "UNEB",
    new: true,
  },
  { id: "paper-2", title: "P425/2 Pure Mathematics (2024)", badge: "UNEB" },
  { id: "paper-3", title: "P530 Biology Paper 1", badge: "WAKISSHA" },
  {
    id: "paper-4",
    title: "P545 Chemistry Practical",
    badge: "UMTA",
    new: true,
  },
  { id: "paper-5", title: "P210 English Language", badge: "MEBU" },
];

export default function LibraryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(["more-2"]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const topics = useMemo(() => topicData, []);
  const teachers = useMemo(() => teacherData, []);
  const books = useMemo(() => bookData, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }, []);

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
          <Text style={styles.pageTitle}>Library</Text>
          {/* <Text style={styles.pageSubtitle}>Study smarter with curated books, notes and past papers built for exam success.</Text> */}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360)}>
          <SearchBar />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.heroCard}
        >
          <LinearGradient
            colors={["#ffffff", "#6d7bff"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroText}>
              <Text style={styles.heroBadge}>New • Curated collection</Text>
              <Text style={styles.heroTitle}>
                Discover premium resources for every subject.
              </Text>
              <Text style={styles.heroSubtitle}>
                From revision guides to exam solutions, everything is neatly
                organised.
              </Text>
              <PrimaryButton title="Explore now" icon="arrow-right" />
            </View>
            {/* <Image source={require('../../assets/images/bookshop.png')} style={styles.heroImage} contentFit="contain" /> */}
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(440)} style={styles.section}>
          <SectionHeader
            title="Read About"
            subtitle="Quick study ideas for every topic"
            onSeeAll={() => {}}
            actionLabel="More"
          />
          <ReadAboutGrid data={topics} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(480)} style={styles.section}>
          <SectionHeader
            title="Teacher's Notes"
            subtitle="Learn from experienced educators"
            onSeeAll={() => {}}
          />
          <TeacherCarousel data={teachers} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(520)} style={styles.section}>
          <Image
            source={require("../../assets/images/banner.png")}
            style={styles.bannerImage}
            contentFit="contain"
          />
          <SectionHeader
            title="Recommended Books"
            subtitle="Hand-picked textbooks and revision guides recommended by experienced teachers"
            onSeeAll={() => {}}
          />
          <RecommendedBookCarousel data={books} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(560)} style={styles.section}>
          <SectionHeader
            title="More Books"
            subtitle="A wider collection for steady revision and enrichment"
            onSeeAll={() => {}}
          />
          <View style={styles.listWrap}>
            {moreBooksData.map((item) => (
              <BookListItem
                key={item.id}
                item={{ ...item, bookmarked: bookmarkedIds.includes(item.id) }}
                onPress={() => toggleBookmark(item.id)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
          <SectionHeader
            title="Past Papers & Solutions"
            subtitle="Practice with realistic exam questions and solution guides"
            onSeeAll={() => {}}
          />
          <View style={styles.chipRow}>
            {chipData.map((chip) => (
              <SubjectChip key={chip.id} item={chip} />
            ))}
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Year</Text>
            <YearDropdown value="2025" />
          </View>
          <PastPaperList data={paperData} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(640)}
          style={styles.footerWrap}
        >
          <Image
            source={require("../../assets/images/footer-lib.png")}
            style={styles.footerImage}
            contentFit="contain"
          />
        </Animated.View>
      </ScrollView>
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
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: dimensions.width < 400 ? 0 : 12,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    maxWidth: dimensions.maxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.title,
    fontSize: 34,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  heroCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginHorizontal: dimensions.width < 400 ? -2 : 0,
    ...shadows.card,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: dimensions.width < 400 ? spacing.md : spacing.lg,
  },
  heroText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  heroBadge: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
    marginBottom: spacing.lg,
    lineHeight: 35,
  },
  heroSubtitle: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: 120,
    height: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  bannerImage: {
    width: "100%",
    height: 180,
    marginBottom: spacing.md,
  },
  listWrap: {
    paddingBottom: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  filterLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  footerWrap: {
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footerImage: {
    width: "100%",
    height: 170,
  },
  skeletonContent: {
    flex: 1,
    paddingHorizontal: dimensions.width < 400 ? 8 : 12,
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
    height: 160,
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
