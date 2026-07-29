import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { ImageSourcePropType } from "react-native";
import { db } from "../../firebaseConfig";

type ImageSource = string | ImageSourcePropType;

export type HeroBook = {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  image: ImageSource;
  badge?: string;
};

export type TopSellingBook = {
  id: string;
  title: string;
  author: string;
  rating: string;
  avatar: ImageSource;
  image: ImageSource;
  badge?: string;
};

export type PromotionalBannerItem = {
  title: string;
  description: string;
  image: ImageSource;
  avatar: ImageSource;
};

export type PaperItem = {
  id: string;
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: ImageSource;
  document?: string;
};

export type PaperSection = {
  title: string;
  items: PaperItem[];
};

const DEFAULT_HERO_IMAGE = require("../../assets/images/lib.jpeg");
const DEFAULT_AVATAR = require("../../assets/images/user.png");
const DEFAULT_PAPER_IMAGE = require("../../assets/images/pdf-preview.jpeg");

const OPERO_STEPHEN_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";

const pickString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const pickImage = (value: unknown, fallback: ImageSource): ImageSource => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const formatPages = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} ${value === 1 ? "Page" : "Pages"}`;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return `${parsed} ${parsed === 1 ? "Page" : "Pages"}`;
    }
    return value.trim();
  }
  return "12 Pages";
};

const resolveAuthorAvatar = (authorName: string): ImageSource => {
  if (authorName.trim().toLowerCase() === "opero stephen") {
    return OPERO_STEPHEN_AVATAR;
  }
  return DEFAULT_AVATAR;
};

const getRatingValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const formatRating = (value: number): string => {
  return value > 0 ? `${value.toFixed(1)} ★` : "4.7 ★";
};

export function useLibraryData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          const data = doc.data() as Record<string, unknown>;
          const ratingVal = getRatingValue(
            data.rating || data.averageRating || data.score,
          );
          const isTop = Boolean(data.isTop || data.featured || data.highlight);
          const authorName = pickString(
            data.author || data.writer || data.publisher,
            "Unknown author",
          );

          return {
            id: doc.id || `book-${index}`,
            title: pickString(
              data.title || data.name || data.bookTitle,
              "Untitled book",
            ),
            author: authorName,
            subtitle: pickString(
              data.subtitle || data.summary || data.description,
              "Fresh study resource",
            ),
            image: pickImage(
              data.image || data.coverImage || data.cover || data.thumbnail,
              DEFAULT_HERO_IMAGE,
            ),
            badge: pickString(
              data.badge || (isTop ? "Featured" : data.type),
              isTop ? "Featured" : "New",
            ),
            avatar: resolveAuthorAvatar(authorName),
            ratingValue: ratingVal,
            isTop,
          };
        })
        .sort((a, b) => b.ratingValue - a.ratingValue);

      const featuredBooks = allBooks.filter((book) => book.isTop);
      const heroItems = (featuredBooks.length > 0 ? featuredBooks : allBooks)
        .slice(0, 6)
        .map(({ id, title, author, subtitle, image, badge }) => ({
          id,
          title,
          author,
          subtitle,
          image,
          badge,
        }));

      const topSellingItems = allBooks.slice(0, 6).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        rating: formatRating(book.ratingValue),
        avatar: book.avatar,
        image: book.image,
        badge: book.badge,
      }));

      const promotionalItems = promoSnapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
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
            data.cover || data.image || data.coverImage || data.thumbnail,
            DEFAULT_HERO_IMAGE,
          ),
          avatar: pickImage(
            data.avatar || data.authorAvatar || data.userImage,
            DEFAULT_AVATAR,
          ),
        };
      });

      const paperGroups = new Map<string, PaperItem[]>();
      papersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data() as Record<string, unknown>;
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
        const pages = formatPages(data.pages ?? data.pageCount);

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
            DEFAULT_PAPER_IMAGE,
          ),
          document: pickString(
            data.doc || data.document || data.pdf || data.url,
            "",
          ),
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

  return {
    loading,
    refreshing,
    heroSlides,
    topBooks,
    promos,
    paperCollections,
    loadLibraryData,
    onRefresh,
  };
}
