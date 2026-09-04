import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { getVideoThumbnailUrl } from "../utils/videoUtils";

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

export function useTrendingLessons() {
  const [lessons, setLessons] = useState<TrendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "trendingLessons"),
      (snapshot) => {
        const next = snapshot.docs.map((doc, index) =>
          toTrendingLesson(doc.data() as FirestoreLesson, doc.id, index),
        );
        setLessons(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useTrendingLessons error:", err);
        setError("Failed to load lessons");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { lessons, loading, error };
}
