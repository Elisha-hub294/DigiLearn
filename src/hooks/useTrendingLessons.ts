import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { readLocalCache, writeLocalCache } from "../utils/localCache";
import { getVideoThumbnailUrl } from "../utils/videoUtils";

const TRENDING_CACHE_KEY = "digilearn-trending-lessons-shared";
const TRENDING_CACHE_VERSION = 1;
const TRENDING_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

export type TrendingLesson = {
  id: string;
  title: string;
  teacher: string;
  duration: string;
  thumbnail: string;
  subject: string;
  link: string;
  description: string;
};

type FirestoreLesson = {
  id?: string;
  title?: string;
  teacher?: string;
  duration?: string;
  thumbnail?: string;
  subject?: string | string[];
  link?: string;
  description?: string;
  uploadedAt?: unknown;
  avatar?: string;
};

let trendingFetchPromise: Promise<TrendingLesson[]> | null = null;

function toTrendingLesson(
  raw: FirestoreLesson,
  docId: string,
  index: number,
): TrendingLesson {
  const link = raw.link ?? "";
  const thumbnail = getVideoThumbnailUrl(raw.thumbnail, link);
  return {
    id: raw.id ?? docId ?? `lesson-${index}`,
    title: raw.title ?? "Untitled lesson",
    teacher: raw.teacher ?? "Teacher",
    duration: raw.duration ?? "00:00",
    thumbnail,
    subject: Array.isArray(raw.subject)
      ? raw.subject.join(", ") || "General"
      : (raw.subject ?? "General"),
    link,
    description: raw.description ?? "",
  };
}

function fetchTrendingLessons(): Promise<TrendingLesson[]> {
  if (trendingFetchPromise) return trendingFetchPromise;

  trendingFetchPromise = getDocs(collection(db, "trendingLessons"))
    .then((snapshot) =>
      snapshot.docs.map((doc, index) =>
        toTrendingLesson(doc.data() as FirestoreLesson, doc.id, index),
      ),
    )
    .finally(() => {
      trendingFetchPromise = null;
    });

  return trendingFetchPromise;
}

export function useTrendingLessons() {
  const [lessons, setLessons] = useState<TrendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLessons = async () => {
      const cached = await readLocalCache<TrendingLesson[]>(
        TRENDING_CACHE_KEY,
        TRENDING_CACHE_VERSION,
      );
      if (cached && isMounted) {
        setLessons(cached.data);
        setLoading(false);
        setError(null);
        if (Date.now() - cached.savedAt < TRENDING_CACHE_MAX_AGE_MS) return;
      }

      try {
        const next = await fetchTrendingLessons();
        if (!isMounted) return;
        setLessons(next);
        setLoading(false);
        setError(null);
        await writeLocalCache(TRENDING_CACHE_KEY, next, TRENDING_CACHE_VERSION);
      } catch (err) {
        console.error("useTrendingLessons error:", err);
        if (!isMounted) return;
        setError("Failed to load lessons");
        setLoading(false);
      }
    };

    void loadLessons();
    return () => {
      isMounted = false;
    };
  }, []);

  return { lessons, loading, error };
}
