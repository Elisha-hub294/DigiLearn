import { useEffect, useState } from "react";
import { loadTrendingLessons } from "../services/trendingLessonsService";

export type TrendingLesson = {
  id: string;
  title: string;
  teacher: string;
  duration: string;
  thumbnail: string;
  subject: string;
  link: string;
  description: string;
  owner?: string;
};

function toTrendingLesson(
  raw: Awaited<ReturnType<typeof loadTrendingLessons>>[number],
): TrendingLesson {
  return {
    id: raw.id,
    title: raw.title,
    teacher: raw.teacher,
    duration: raw.duration,
    thumbnail: raw.thumbnail,
    subject: raw.subject,
    link: raw.link,
    description: raw.description,
    owner: raw.owner,
  };
}

export function useTrendingLessons() {
  const [lessons, setLessons] = useState<TrendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLessons = async () => {
      try {
        const cachedLessons = await loadTrendingLessons();
        if (!isMounted) return;
        const next = cachedLessons.map(toTrendingLesson);
        setLessons(next);
        setLoading(false);
        setError(null);
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
