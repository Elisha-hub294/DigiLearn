import { Feather as Icon } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { CategorySlider } from "../components/library/CategorySlider";
import { HeroBookCarousel } from "../components/library/HeroBookCarousel";
import { PaperCarousel } from "../components/library/PaperCarousel";
import { PromotionalBanner } from "../components/library/PromotionalBanner";
import { TopSellingBooks } from "../components/library/TopSellingBooks";
import { Header } from "../components/ui/Header";
import { SearchBar } from "../components/ui/SearchBar";
import { SectionHeader } from "../components/ui/SectionHeader";
import { colors, dimensions, radius, spacing } from "../constants/theme";

type HeroBook = {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  image: any;
  badge?: string;
};

type CategoryItem = {
  id: string;
  label: string;
  icon: any;
};

type TopSellingBook = {
  id: string;
  title: string;
  author: string;
  rating: string;
  avatar: any;
  image: any;
  badge?: string;
};

type PromotionalBannerItem = {
  title: string;
  description: string;
  image: any;
  avatar: any;
};

type PaperItem = {
  id: string;
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: any;
  document?: string;
};

type PaperSection = {
  title: string;
  items: PaperItem[];
};

const defaultHeroImage = require("../../assets/images/lib.jpeg");
const defaultAvatar = require("../../assets/images/user.png");
const defaultPaperImage = require("../../assets/images/pdf-preview.jpeg");

const categories: CategoryItem[] = [
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

const pickString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
};

const pickImage = (value: unknown, fallback: any) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
};

const formatRating = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(1)} ★`;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return `${parsed.toFixed(1)} ★`;
    }
    return value;
  }

  return "4.7 ★";
};

const getRatingValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export default function LibraryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<"book" | "banner" | "paper">("book");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formExtra, setFormExtra] = useState("");
  const [formCover, setFormCover] = useState("");
  const [formRating, setFormRating] = useState("");
  const [formIsTop, setFormIsTop] = useState(false);
  const [heroSlides, setHeroSlides] = useState<HeroBook[]>([]);
  const [topBooks, setTopBooks] = useState<TopSellingBook[]>([]);
  const [promos, setPromos] = useState<PromotionalBannerItem[]>([]);
  const [paperCollections, setPaperCollections] = useState<PaperSection[]>([]);

  const loadLibraryData = useCallback(async () => {
    try {
      const [booksSnapshot, promoSnapshot, papersSnapshot] = await Promise.all([
        getDocs(collection(db, "books")),
        getDocs(collection(db, "promotionalBanner")),
        getDocs(collection(db, "pastPaper")),
      ]);

      const allBooks = booksSnapshot.docs
        .map((doc, index) => {
          const data = doc.data() as Record<string, any>;
          const title = pickString(
            data.title || data.name || data.bookTitle,
            "Untitled book",
          );
          const author = pickString(
            data.author || data.writer || data.publisher,
            "Unknown author",
          );
          const subtitle = pickString(
            data.subtitle || data.summary || data.description,
            "Fresh study resource",
          );
          const badge = pickString(
            data.badge || (data.isTop ? "Featured" : data.type),
            data.isTop ? "Featured" : "New",
          );

          return {
            id: doc.id || `book-${index}`,
            title,
            author,
            subtitle,
            image: pickImage(
              data.image || data.coverImage || data.cover || data.thumbnail,
              defaultHeroImage,
            ),
            badge,
            ratingValue: getRatingValue(
              data.rating || data.averageRating || data.score,
            ),
            isTop: Boolean(data.isTop || data.featured || data.highlight),
          };
        })
        .sort((a, b) => Number(b.ratingValue) - Number(a.ratingValue));

      const featuredBooks = allBooks.filter((book) => book.isTop);
      const heroItems = (featuredBooks.length > 0 ? featuredBooks : allBooks)
        .slice(0, 6)
        .map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          subtitle: book.subtitle,
          image: book.image,
          badge: book.badge,
        }));

      const topSellingItems = allBooks.slice(0, 6).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        rating: formatRating(book.ratingValue),
        avatar: pickImage(
          (book as any).avatar ||
            (book as any).authorAvatar ||
            (book as any).authorImage,
          defaultAvatar,
        ),
        image: book.image,
        badge: book.badge,
      }));

      const promotionalItems = promoSnapshot.docs.map((doc, index) => {
        const data = doc.data() as Record<string, any>;
        return {
          title: pickString(
            data.title || data.name || data.heading,
            "Fresh learning picks",
          ),
          description: pickString(
            data.description || data.summary || data.caption,
            "Explore a new study experience",
          ),
          image: pickImage(
            data.image || data.coverImage || data.thumbnail,
            defaultHeroImage,
          ),
          avatar: pickImage(
            data.avatar || data.authorAvatar || data.userImage,
            defaultAvatar,
          ),
        };
      });

      const paperGroups = new Map<string, PaperItem[]>();
      papersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data() as Record<string, any>;
        const type = pickString(
          data.type || data.examType || data.category || data.paperType,
          "Paper",
        );
        const year = pickString(
          data.year || data.examYear || data.session || data.publishedYear,
          "2025",
        );
        const title = pickString(data.title || data.name, `Paper ${index + 1}`);
        const subject = pickString(data.subject || data.topic, "General");
        const pages = pickString(data.pages || data.pageCount, "12 Pages");

        const sectionKey = `${type} ${year}`.trim();
        const sectionItems = paperGroups.get(sectionKey) ?? [];
        sectionItems.push({
          id: doc.id || `paper-${index}`,
          title,
          subject,
          year,
          pages,
          image: pickImage(
            data.image || data.coverImage || data.thumbnail,
            defaultPaperImage,
          ),
          document: pickString(data.document || data.pdf || data.url, ""),
        });
        paperGroups.set(sectionKey, sectionItems);
      });

      const sections = Array.from(paperGroups.entries()).map(
        ([heading, items]) => ({
          title: heading,
          items,
        }),
      );

      setHeroSlides(heroItems);
      setTopBooks(topSellingItems);
      setPromos(promotionalItems);
      setPaperCollections(sections);
    } catch (error) {
      console.error("Failed to load library data", error);
      setHeroSlides([]);
      setTopBooks([]);
      setPromos([]);
      setPaperCollections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLibraryData();
  }, [loadLibraryData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLibraryData();
  }, [loadLibraryData]);

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormSubtitle("");
    setFormAuthor("");
    setFormExtra("");
    setFormCover("");
    setFormRating("");
    setFormIsTop(false);
  }, []);

  const openForm = useCallback(
    (type: "book" | "banner" | "paper") => {
      setFormType(type);
      resetForm();
      setShowModal(true);
    },
    [resetForm],
  );

  const handleAddItem = useCallback(async () => {
    try {
      setIsAdding(true);

      const payload = {
        title: formTitle.trim() || "Untitled",
        createdAt: serverTimestamp(),
      };

      if (formType === "book") {
        const parsedRating = Number.parseFloat(formRating.trim());

        await addDoc(collection(db, "books"), {
          ...payload,
          author: formAuthor.trim() || "Added from app",
          subtitle:
            formSubtitle.trim() || "Freshly created from the library screen",
          image:
            formCover.trim() ||
            "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png",
          avatar:
            "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png",
          rating: Number.isFinite(parsedRating) ? parsedRating : 4.8,
          isTop: formIsTop,
        });
      } else if (formType === "banner") {
        await addDoc(collection(db, "promotionalBanner"), {
          ...payload,
          description:
            formSubtitle.trim() || "Added directly from the library screen",
          image:
            "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png",
          avatar:
            "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png",
        });
      } else {
        await addDoc(collection(db, "pastPaper"), {
          ...payload,
          subject: formSubtitle.trim() || "General",
          type: formAuthor.trim() || "UNEB",
          year: formExtra.trim() || "2026",
          pages: "12 Pages",
          image:
            "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png",
          document: "",
        });
      }

      setShowModal(false);
      resetForm();
      Alert.alert("Added", "The new item was saved to Firestore.");
      await loadLibraryData();
    } catch (error) {
      console.error("Failed to add library item", error);
      Alert.alert("Error", "The item could not be added. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }, [
    formAuthor,
    formCover,
    formExtra,
    formIsTop,
    formRating,
    formSubtitle,
    formTitle,
    formType,
    loadLibraryData,
    resetForm,
  ]);

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
            actionLabel="Browse"
          />
          <CategorySlider items={categories} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(480)} style={styles.section}>
          <SectionHeader
            title="Featured notes"
            onSeeAll={() => {}}
            actionLabel="More"
          />
          <FeaturedNoteCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(560)} style={styles.section}>
          <SectionHeader
            title="Top selling books"
            onSeeAll={() => {}}
            actionLabel="See all"
          />
          <TopSellingBooks items={topBooks} />
        </Animated.View>

        {promos[0] ? (
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.section}
          >
            <PromotionalBanner {...promos[0]} />
          </Animated.View>
        ) : null}

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add new library item"
        style={[styles.fab, isAdding && styles.fabDisabled]}
        onPress={() => openForm("book")}
        disabled={isAdding}
      >
        <Icon
          name={isAdding ? "loader" : "plus"}
          size={24}
          color={colors.white}
        />
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {formType === "book"
                ? "Add a book"
                : formType === "banner"
                  ? "Add a banner"
                  : "Add a past paper"}
            </Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder={
                formType === "book"
                  ? "Book title"
                  : formType === "banner"
                    ? "Banner title"
                    : "Paper title"
              }
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {formType === "book" ? (
              <>
                <Text style={styles.fieldLabel}>Author</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Author"
                  value={formAuthor}
                  onChangeText={setFormAuthor}
                />
                <Text style={styles.fieldLabel}>Subtitle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Short description"
                  value={formSubtitle}
                  onChangeText={setFormSubtitle}
                />
                <Text style={styles.fieldLabel}>Cover</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL"
                  value={formCover}
                  onChangeText={setFormCover}
                />
                <Text style={styles.fieldLabel}>Rating</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4.8"
                  value={formRating}
                  onChangeText={setFormRating}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>Featured</Text>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      formIsTop && styles.toggleChipActive,
                    ]}
                    onPress={() => setFormIsTop(true)}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        formIsTop && styles.toggleChipTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      !formIsTop && styles.toggleChipActive,
                    ]}
                    onPress={() => setFormIsTop(false)}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        !formIsTop && styles.toggleChipTextActive,
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {formType === "banner" ? (
              <>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Short description"
                  value={formSubtitle}
                  onChangeText={setFormSubtitle}
                />
              </>
            ) : null}

            {formType === "paper" ? (
              <>
                <Text style={styles.fieldLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Subject"
                  value={formSubtitle}
                  onChangeText={setFormSubtitle}
                />
                <Text style={styles.fieldLabel}>Exam type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="UNEB / MOCK"
                  value={formAuthor}
                  onChangeText={setFormAuthor}
                />
                <Text style={styles.fieldLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026"
                  value={formExtra}
                  onChangeText={setFormExtra}
                />
              </>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleAddItem}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  fabDisabled: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  toggleChip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  toggleChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  toggleChipText: {
    color: colors.subtitle,
    fontWeight: "700",
  },
  toggleChipTextActive: {
    color: colors.primary,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
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
