import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../firebaseConfig";
import { DEFAULT_SUBJECT_AVATAR } from "../components/page/pageTypes";

const RECENT_SEARCHES_KEY = "@digilearn_recent_searches";
const MAX_RECENT_ITEMS = 20;
const FALLBACK_PDF_ICON =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/pages-2d.png";
const FALLBACK_TEACHER_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";

export type SearchCategory =
  | "All"
  | "Notes"
  | "Books"
  | "Videos"
  | "Teachers"
  | "Past Papers";

export type SearchResultType =
  | "topicalNote"
  | "pastPaper"
  | "video"
  | "book"
  | "teacher";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  teacher?: string;
  subject?: string | string[];
  previewImage: string;
  avatar?: string;
  duration?: string;
  uploadedAt?: string;
  link?: string;
  doc?: string;
  rawItem: any;
};

export function parseUploadedDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Handle Firestore Timestamp object with toDate()
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      try {
        const d = candidate.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
  }

  // Handle object with seconds property { seconds: number }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const candidate = value as { seconds?: number };
    if (typeof candidate.seconds === "number") {
      const d = new Date(candidate.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Handle string like "Timestamp(seconds=1784627982, nanoseconds=...)"
  if (typeof value === "string") {
    const tsMatch = value.match(/seconds\s*=\s*(\d+)/i);
    if (tsMatch && tsMatch[1]) {
      const sec = parseInt(tsMatch[1], 10);
      if (!isNaN(sec)) {
        const d = new Date(sec * 1000);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Standard string date parsing
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Handle numeric timestamp
  if (typeof value === "number" && !isNaN(value)) {
    const d = new Date(value > 1e11 ? value : value * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function formatUploadedAt(value: unknown): string {
  if (!value) return "Recently added";

  // If it's already a clean string like "2 days ago", "Today", or "Oct 12, 2025"
  if (
    typeof value === "string" &&
    !value.includes("Timestamp") &&
    !value.includes("seconds=")
  ) {
    if (value.trim()) return value.trim();
  }

  const parsed = parseUploadedDate(value);
  if (!parsed) {
    return "Recently added";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "1 day ago";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [topicalNotes, setTopicalNotes] = useState<any[]>([]);
  const [pastPapers, setPastPapers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [teachersAvatarMap, setTeachersAvatarMap] = useState<Record<string, string>>({});
  const [defaultPdfIcon, setDefaultPdfIcon] = useState<string>(FALLBACK_PDF_ICON);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load recent searches from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, MAX_RECENT_ITEMS));
          }
        }
      } catch (err) {
        console.warn("Failed to load recent searches:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch subject icons and default pdf icon
  useEffect(() => {
    let isMounted = true;

    const unsubSubjects = onSnapshot(
      collection(db, "subject"),
      (snapshot) => {
        if (!isMounted) return;
        const map: Record<string, string> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name && data.avatar) {
            map[data.name.toLowerCase().trim()] = data.avatar;
          }
        });
        setSubjectsMap(map);
      },
      (err) => console.warn("Error fetching subjects:", err)
    );

    (async () => {
      try {
        const defaultSnap = await getDocs(collection(db, "default"));
        if (!isMounted) return;
        let pdfIcon = "";
        defaultSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name && String(data.name).toLowerCase() === "pdf") {
            pdfIcon = data.icon || data.avatar || "";
          }
        });
        if (pdfIcon) {
          setDefaultPdfIcon(pdfIcon);
        }
      } catch (err) {
        console.warn("Error fetching default pdf icon:", err);
      }
    })();

    return () => {
      isMounted = false;
      unsubSubjects();
    };
  }, []);

  // 3. Subscribe to Firestore collections simultaneously
  useEffect(() => {
    let isMounted = true;

    const unsubNotes = onSnapshot(
      collection(db, "topicalNotesCards"),
      (snap) => {
        if (!isMounted) return;
        setTopicalNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Notes error:", err)
    );

    const unsubPapers = onSnapshot(
      collection(db, "pastPaper"),
      (snap) => {
        if (!isMounted) return;
        setPastPapers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Papers error:", err)
    );

    const unsubVideos = onSnapshot(
      collection(db, "trendingLessons"),
      (snap) => {
        if (!isMounted) return;
        setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Videos error:", err)
    );

    const unsubBooks = onSnapshot(
      collection(db, "books"),
      (snap) => {
        if (!isMounted) return;
        setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Books error:", err)
    );

    const unsubTeachers = onSnapshot(
      collection(db, "teachers"),
      (snap) => {
        if (!isMounted) return;
        const teacherList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeachers(teacherList);

        const avatarMap: Record<string, string> = {};
        teacherList.forEach((t: any) => {
          if (t.name && (t.avatar || t.image)) {
            const nameKey = String(t.name).toLowerCase().trim();
            avatarMap[nameKey] = String(t.avatar || t.image).trim();
          }
        });
        setTeachersAvatarMap(avatarMap);
        setLoading(false);
      },
      (err) => {
        console.warn("Teachers error:", err);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubNotes();
      unsubPapers();
      unsubVideos();
      unsubBooks();
      unsubTeachers();
    };
  }, []);

  // 4. Debounce search input (250–350 ms)
  const handleSetQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  }, []);

  // 5. Recent searches persistence
  const addRecentSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (item) => item.toLowerCase() !== trimmed.toLowerCase()
        );
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_ITEMS);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(
          (err) => console.warn("Failed to persist recent search:", err)
        );
        return updated;
      });
    },
    []
  );

  const removeRecentSearch = useCallback(
    async (term: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter((item) => item !== term);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(
          (err) => console.warn("Failed to persist recent search removal:", err)
        );
        return updated;
      });
    },
    []
  );

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([]));
  }, []);

  // Helper to match subject image
  const getNotePreview = useCallback(
    (item: any): string => {
      const sub = item.subject;
      const subjects: string[] = Array.isArray(sub)
        ? sub
        : typeof sub === "string"
        ? [sub]
        : [];
      for (const s of subjects) {
        const norm = s.toLowerCase().trim();
        if (subjectsMap[norm]) return subjectsMap[norm];
      }
      return item.preview || item.avatar || DEFAULT_SUBJECT_AVATAR;
    },
    [subjectsMap]
  );

  // Helper to resolve teacher avatar from teachers collection
  const resolveTeacherAvatar = useCallback(
    (teacherName?: string, rawAvatar?: any): string => {
      if (typeof rawAvatar === "string" && rawAvatar.trim()) {
        return rawAvatar.trim();
      }
      if (teacherName) {
        const key = teacherName.toLowerCase().trim();
        if (teachersAvatarMap[key]) {
          return teachersAvatarMap[key];
        }
      }
      return FALLBACK_TEACHER_AVATAR;
    },
    [teachersAvatarMap]
  );

  // 6. Comprehensive filtering & Priority ranking
  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const scored: { score: number; item: SearchResult }[] = [];

    const addScored = (
      rawItem: any,
      type: SearchResultType,
      title: string,
      subtitle: string,
      description: string,
      author: string,
      teacher: string,
      subjectProp: any,
      previewImage: string,
      extra?: Partial<SearchResult>
    ) => {
      const lowerTitle = title.toLowerCase();
      const lowerAuthor = author.toLowerCase();
      const lowerTeacher = teacher.toLowerCase();

      const rawSub = subjectProp;
      const subjects: string[] = Array.isArray(rawSub)
        ? rawSub.map((s) => String(s).toLowerCase())
        : typeof rawSub === "string"
        ? [rawSub.toLowerCase()]
        : [];

      const rawKw = rawItem.keywords;
      const keywords: string[] = Array.isArray(rawKw)
        ? rawKw.map((k) => String(k).toLowerCase())
        : typeof rawKw === "string"
        ? [rawKw.toLowerCase()]
        : [];

      let score = 0;

      // Ranking Priority Rules:
      // 1. Exact title/name match
      if (lowerTitle === q) score += 1000;
      // 2. Title starts with
      else if (lowerTitle.startsWith(q)) score += 500;
      // 3. Subject match
      if (subjects.some((s) => s.includes(q))) score += 400;
      // 4. Author match
      if (lowerAuthor && lowerAuthor.includes(q)) score += 300;
      // 5. Teacher match
      if (lowerTeacher && lowerTeacher.includes(q)) score += 250;
      // 6. Keyword match
      if (keywords.some((k) => k.includes(q))) score += 200;
      // 7. Partial title match
      if (lowerTitle.includes(q) && score < 500) score += 150;
      // 8. Description match
      if (description.toLowerCase().includes(q)) score += 50;

      if (score > 0) {
        scored.push({
          score,
          item: {
            id: String(rawItem.id || Math.random()),
            type,
            title,
            subtitle,
            description,
            author,
            teacher,
            subject: subjectProp,
            previewImage,
            rawItem,
            ...extra,
          },
        });
      }
    };

    // Evaluate Notes
    topicalNotes.forEach((n) => {
      addScored(
        n,
        "topicalNote",
        String(n.title || "Untitled Note"),
        String(n.subject || "General"),
        String(n.description || ""),
        "",
        "",
        n.subject,
        getNotePreview(n)
      );
    });

    // Evaluate Past Papers
    pastPapers.forEach((p) => {
      addScored(
        p,
        "pastPaper",
        String(p.title || "Past Paper"),
        String(p.subject || "UNEB"),
        String(p.description || ""),
        "",
        "",
        p.subject,
        p.icon || p.avatar || defaultPdfIcon,
        { doc: p.doc || p.pdf }
      );
    });

    // Evaluate Videos
    videos.forEach((v) => {
      const teacherName = String(v.teacher || "Teacher");
      const videoAvatar = resolveTeacherAvatar(teacherName, v.avatar);
      const cleanUploadedAt = formatUploadedAt(v.uploadedAt);

      addScored(
        v,
        "video",
        String(v.title || "Untitled Video"),
        String(v.subject || "Lesson"),
        "",
        "",
        teacherName,
        v.subject,
        typeof v.thumbnail === "string" ? v.thumbnail : "",
        {
          duration: v.duration || "10:00",
          uploadedAt: cleanUploadedAt,
          avatar: videoAvatar,
          link: v.link || "",
        }
      );
    });

    // Evaluate Books
    books.forEach((b) => {
      addScored(
        b,
        "book",
        String(b.title || "Untitled Book"),
        String(b.author || "Unknown Author"),
        String(b.description || ""),
        String(b.author || ""),
        "",
        b.subject,
        typeof b.cover === "string" && b.cover.trim()
          ? b.cover.trim()
          : typeof b.image === "string" && b.image.trim()
          ? b.image.trim()
          : typeof b.avatar === "string" && b.avatar.trim()
          ? b.avatar.trim()
          : ""
      );
    });

    // Evaluate Teachers
    teachers.forEach((t) => {
      const teacherName = String(t.name || "Teacher");
      const teacherAvatar = resolveTeacherAvatar(teacherName, t.avatar || t.image);

      addScored(
        t,
        "teacher",
        teacherName,
        String(t.subject || "Instructor"),
        String(t.bio || t.description || `${t.subject || "Educator"} at ${t.school || "DigiLearn"}`),
        "",
        teacherName,
        t.subject,
        teacherAvatar,
        {
          avatar: teacherAvatar,
        }
      );
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply category filter if active
    const mapped = scored.map((s) => s.item);
    if (selectedCategory === "All") return mapped;

    const categoryMap: Record<SearchCategory, SearchResultType | null> = {
      All: null,
      Notes: "topicalNote",
      "Past Papers": "pastPaper",
      Videos: "video",
      Books: "book",
      Teachers: "teacher",
    };

    const targetType = categoryMap[selectedCategory];
    if (!targetType) return mapped;

    return mapped.filter((i) => i.type === targetType);
  }, [
    debouncedQuery,
    selectedCategory,
    topicalNotes,
    pastPapers,
    videos,
    books,
    teachers,
    defaultPdfIcon,
    getNotePreview,
    resolveTeacherAvatar,
  ]);

  const triggerManualSearch = useCallback(() => {
    setDebouncedQuery(query);
    if (query.trim().length >= 2) {
      addRecentSearch(query.trim());
    }
  }, [query, addRecentSearch]);

  return {
    query,
    setQuery: handleSetQuery,
    debouncedQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    recentSearches,
    loading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    triggerManualSearch,
  };
}
