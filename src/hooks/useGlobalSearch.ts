import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../firebaseConfig";
import { DEFAULT_SUBJECT_AVATAR } from "../components/page/pageTypes";

const RECENT_SEARCHES_KEY = "@digilearn_recent_searches";
const MAX_RECENT_ITEMS = 10;
const FALLBACK_PDF_ICON =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/library/pages-2d.png";

export type SearchResultType = "topicalNote" | "pastPaper";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  previewImage: string;
  rawItem: any;
  keywords?: string[];
  subject?: string[];
};

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [topicalNotes, setTopicalNotes] = useState<any[]>([]);
  const [pastPapers, setPastPapers] = useState<any[]>([]);
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

    // Fetch subjects
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

    // Fetch default pdf icon from collection "default" where name == "pdf"
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

  // 3. Subscribe to topicalNotesCards and pastPaper collections
  useEffect(() => {
    let isMounted = true;
    let loadedNotes = false;
    let loadedPapers = false;

    const checkLoadingState = () => {
      if (loadedNotes && loadedPapers && isMounted) {
        setLoading(false);
      }
    };

    const unsubNotes = onSnapshot(
      collection(db, "topicalNotesCards"),
      (snapshot) => {
        if (!isMounted) return;
        const notes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTopicalNotes(notes);
        loadedNotes = true;
        checkLoadingState();
      },
      (err) => {
        console.warn("Error fetching topicalNotesCards:", err);
        loadedNotes = true;
        checkLoadingState();
      }
    );

    const unsubPapers = onSnapshot(
      collection(db, "pastPaper"),
      (snapshot) => {
        if (!isMounted) return;
        const papers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPastPapers(papers);
        loadedPapers = true;
        checkLoadingState();
      },
      (err) => {
        console.warn("Error fetching pastPaper:", err);
        loadedPapers = true;
        checkLoadingState();
      }
    );

    return () => {
      isMounted = false;
      unsubNotes();
      unsubPapers();
    };
  }, []);

  // 4. Debounce input query (~300ms)
  const handleSetQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  }, []);

  // 5. Recent search persistence helpers
  const saveRecentSearches = async (newSearches: string[]) => {
    setRecentSearches(newSearches);
    try {
      await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(newSearches)
      );
    } catch (err) {
      console.warn("Failed to save recent searches:", err);
    }
  };

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
          (err) => console.warn("Failed to persist recent searches removal:", err)
        );
        return updated;
      });
    },
    []
  );

  const clearRecentSearches = useCallback(async () => {
    await saveRecentSearches([]);
  }, []);

  // Helper to determine topical note preview image by matching subject collection
  const getTopicalNotePreview = useCallback(
    (item: any): string => {
      const subjectProp = item.subject;
      const subjects: string[] = Array.isArray(subjectProp)
        ? subjectProp
        : typeof subjectProp === "string"
        ? [subjectProp]
        : [];

      for (const sub of subjects) {
        const normalized = sub.toLowerCase().trim();
        if (subjectsMap[normalized]) {
          return subjectsMap[normalized];
        }
      }

      if (item.preview) return item.preview;
      if (item.avatar) return item.avatar;
      return DEFAULT_SUBJECT_AVATAR;
    },
    [subjectsMap]
  );

  // 6. Search filtering & relevance ranking
  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) {
      return [];
    }

    const scoredResults: { score: number; item: SearchResult }[] = [];

    // Helper to evaluate item match score
    const evaluateItem = (
      rawItem: any,
      type: SearchResultType,
      previewImage: string
    ) => {
      const title = String(rawItem.title || "").trim();
      const description = String(rawItem.description || "").trim();

      const rawKeywords = rawItem.keywords;
      const keywords: string[] = Array.isArray(rawKeywords)
        ? rawKeywords.map((k) => String(k).toLowerCase())
        : typeof rawKeywords === "string"
        ? [rawKeywords.toLowerCase()]
        : [];

      const rawSub = rawItem.subject;
      const subjects: string[] = Array.isArray(rawSub)
        ? rawSub.map((s) => String(s).toLowerCase())
        : typeof rawSub === "string"
        ? [rawSub.toLowerCase()]
        : [];

      const lowerTitle = title.toLowerCase();
      const lowerDesc = description.toLowerCase();

      let score = 0;

      if (lowerTitle === q) {
        score += 100;
      } else if (lowerTitle.startsWith(q)) {
        score += 80;
      } else if (lowerTitle.includes(q)) {
        score += 60;
      }

      if (keywords.some((k) => k.includes(q))) {
        score += 40;
      }

      if (subjects.some((s) => s.includes(q))) {
        score += 30;
      }

      if (lowerDesc.includes(q)) {
        score += 20;
      }

      if (score > 0) {
        scoredResults.push({
          score,
          item: {
            id: rawItem.id,
            type,
            title,
            description,
            previewImage,
            rawItem,
            keywords,
            subject: subjects,
          },
        });
      }
    };

    // Evaluate topical notes
    topicalNotes.forEach((note) => {
      evaluateItem(note, "topicalNote", getTopicalNotePreview(note));
    });

    // Evaluate past papers
    pastPapers.forEach((paper) => {
      evaluateItem(
        paper,
        "pastPaper",
        paper.icon || paper.avatar || defaultPdfIcon
      );
    });

    // Sort by relevance score descending
    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.map((r) => r.item);
  }, [debouncedQuery, topicalNotes, pastPapers, defaultPdfIcon, getTopicalNotePreview]);

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
    results,
    recentSearches,
    loading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    triggerManualSearch,
  };
}
