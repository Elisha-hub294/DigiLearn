import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../../firebaseConfig";

type ImageSource = string;

export type HeroSlideItem = {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  image: ImageSource;
  [key: string]: any;
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
  type: string;
  year: string;
  items: PaperItem[];
};

const stringifyCandidate = (val: unknown): string => {
  if (typeof val === "string" && val.trim()) {
    return val.trim();
  }
  if (typeof val === "number" && !Number.isNaN(val)) {
    return String(val);
  }
  if (Array.isArray(val)) {
    const parts = val.map(stringifyCandidate).filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }
  if (typeof val === "object" && val !== null) {
    if ("name" in val)
      return stringifyCandidate((val as { name: unknown }).name);
    if ("title" in val)
      return stringifyCandidate((val as { title: unknown }).title);
    if ("label" in val)
      return stringifyCandidate((val as { label: unknown }).label);
  }
  return "";
};

const pickString = (candidates: unknown | unknown[], fallback = ""): string => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const item of list) {
    const str = stringifyCandidate(item);
    if (str) return str;
  }
  return fallback;
};

const pickImage = (
  candidates: unknown | unknown[],
  fallback: string,
): string => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const item of list) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }
  return fallback;
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
  return "2 Pages";
};

const normalizeKey = (key: string): string => key.trim().toLowerCase();

const resolveAuthorAvatar = (
  authorName: string,
  teacherAvatars: Record<string, string>,
  defaultUserAvatar: string,
): string => {
  const normalizedAuthor = normalizeKey(authorName);
  if (teacherAvatars[normalizedAuthor]) {
    return teacherAvatars[normalizedAuthor];
  }
  const parts = authorName.split(",").map((p) => normalizeKey(p));
  for (const part of parts) {
    if (teacherAvatars[part]) {
      return teacherAvatars[part];
    }
  }
  return defaultUserAvatar;
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

  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [topBooks, setTopBooks] = useState<TopSellingBook[]>([]);
  const [promos, setPromos] = useState<PromotionalBannerItem[]>([]);
  const [paperCollections, setPaperCollections] = useState<PaperSection[]>([]);

  const loadLibraryData = useCallback(async () => {
    try {
      const [
        booksSnapshot,
        promoSnapshot,
        papersSnapshot,
        teachersSnapshot,
        defaultSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "books")),
        getDocs(collection(db, "promotionalBanner")),
        getDocs(collection(db, "pastPaper")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "default")),
      ]);

      let defaultUserAvatar = "";
      defaultSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const docName =
          typeof data.name === "string" ? normalizeKey(data.name) : "";
        if (docName === "user" && typeof data.icon === "string") {
          defaultUserAvatar = data.icon;
        }
      });

      const teacherAvatars: Record<string, string> = {};
      teachersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (typeof data.name === "string" && typeof data.avatar === "string") {
          teacherAvatars[normalizeKey(data.name)] = data.avatar;
        }
      });

      const allBooks = booksSnapshot.docs
        .map((doc, index) => {
          const data = doc.data() as Record<string, unknown>;
          const ratingVal = getRatingValue(
            data.rating || data.averageRating || data.score,
          );
          const isTop = Boolean(data.isTop || data.featured || data.highlight);
          const authorName = pickString(
            [data.author, data.writer, data.publisher],
            "Unknown author",
          );

          return {
            id: doc.id || `book-${index}`,
            title: pickString(
              [data.title, data.name, data.bookTitle],
              "Untitled book",
            ),
            author: authorName,
            subtitle: pickString(
              [data.subtitle, data.summary, data.description],
              "Fresh study resource",
            ),
            image: pickImage(
              [data.image, data.coverImage, data.cover, data.thumbnail],
              "",
            ),
            badge: pickString(
              [data.badge, isTop ? "Featured" : data.type],
              isTop ? "Featured" : "New",
            ),
            avatar: resolveAuthorAvatar(
              authorName,
              teacherAvatars,
              defaultUserAvatar,
            ),
            ratingValue: ratingVal,
            isTop,
          };
        })
        .sort((a, b) => b.ratingValue - a.ratingValue);

      // Derive Hero Slides from top books
      const dynamicHeroSlides: HeroSlideItem[] = allBooks
        .slice(0, 5)
        .map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          subtitle: book.subtitle,
          image: book.image,
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
            [data.title, data.name, data.heading],
            "Fresh learning picks",
          ),
          description: pickString(
            [data.description, data.summary, data.caption],
            "Explore a new study experience",
          ),
          image: pickImage(
            [data.cover, data.image, data.coverImage, data.thumbnail],
            "",
          ),
          avatar: pickImage(
            [data.avatar, data.authorAvatar, data.userImage],
            defaultUserAvatar,
          ),
        };
      });

      const paperGroups = new Map<string, PaperItem[]>();
      papersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data() as Record<string, unknown>;
        const type = pickString(
          [data.type, data.examType, data.category, data.paperType],
          "",
        );
        const year = pickString(
          [data.year, data.examYear, data.session, data.publishedYear],
          "2025",
        );
        const title = pickString([data.title, data.name], `Paper ${index + 1}`);
        const subject = pickString([data.subject, data.topic], "General");
        const pages = formatPages(data.pages ?? data.pageCount);

        const sectionKey = `${type}::${year}`;
        const sectionItems = paperGroups.get(sectionKey) ?? [];
        sectionItems.push({
          id: doc.id || `paper-${index}`,
          title,
          subject,
          year,
          pages,
          image: pickImage([data.image, data.coverImage, data.thumbnail], ""),
          document: pickString(
            [data.doc, data.document, data.pdf, data.url],
            "",
          ),
        });
        paperGroups.set(sectionKey, sectionItems);
      });

      const sections = Array.from(paperGroups.entries()).map(([key, items]) => {
        const [type, year] = key.split("::");
        return {
          title: `${type || "Other"} ${year}`,
          type,
          year,
          items,
        };
      });

      setHeroSlides(dynamicHeroSlides);
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
