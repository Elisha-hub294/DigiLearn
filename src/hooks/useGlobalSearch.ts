import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../firebaseConfig";
import { DEFAULT_SUBJECT_AVATAR } from "../components/page/pageTypes";

const RECENT_SEARCHES_KEY = "@digilearn_recent_searches";
const MAX_RECENT_ITEMS = 10;
const FALLBACK_PDF_ICON =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/pages-2d.png";

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
        setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
      addScored(
        v,
        "video",
        String(v.title || "Untitled Video"),
        String(v.subject || "Lesson"),
        "",
        "",
        String(v.teacher || "Teacher"),
        v.subject,
        typeof v.thumbnail === "string" ? v.thumbnail : "",
        {
          duration: v.duration || "10:00",
          uploadedAt: v.uploadedAt ? String(v.uploadedAt) : "Recently",
          avatar: typeof v.avatar === "string" ? v.avatar : "",
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
        typeof b.image === "string"
          ? b.image
          : typeof b.avatar === "string"
          ? b.avatar
          : ""
      );
    });

    // Evaluate Teachers
    teachers.forEach((t) => {
      addScored(
        t,
        "teacher",
        String(t.name || "Teacher"),
        String(t.subject || "Instructor"),
        String(t.bio || t.description || `${t.subject || "Educator"} at ${t.school || "DigiLearn"}`),
        "",
        String(t.name || ""),
        t.subject,
        typeof t.image === "string"
          ? t.image
          : typeof t.avatar === "string"
          ? t.avatar
          : ""
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
