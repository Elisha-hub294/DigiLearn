import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";

export type TrendingLesson = {
  id: string;
  title: string;
  teacher: string;
  duration: string;
  thumbnail: string;
  subject: string;
  link: string;
};

type FirestoreLesson = {
  id?: string;
  title?: string;
  teacher?: string;
  duration?: string;
  thumbnail?: string;
  subject?: string;
  link?: string;
  uploadedAt?: unknown;
  avatar?: string;
};

function toTrendingLesson(
  raw: FirestoreLesson,
  docId: string,
  index: number
): TrendingLesson {
  return {
    id: raw.id ?? docId ?? `lesson-${index}`,
    title: raw.title ?? "Untitled lesson",
    teacher: raw.teacher ?? "Teacher",
    duration: raw.duration ?? "00:00",
    thumbnail: raw.thumbnail ?? "",
    subject: raw.subject ?? "General",
    link: raw.link ?? "",
  };
}

export function useTrendingLessons() {
  const [lessons, setLessons] = useState<TrendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "trendingLessons"),
      (snapshot) => {
        const next = snapshot.docs.map((doc, index) =>
          toTrendingLesson(doc.data() as FirestoreLesson, doc.id, index)
        );
        setLessons(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useTrendingLessons error:", err);
        setError("Failed to load lessons");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { lessons, loading, error };
}
