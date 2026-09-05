import {
  DocumentSnapshot,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  LOCAL_CACHE_KEYS,
  readLocalCache,
  writeLocalCache,
} from "../utils/localCache";
import {
  PaginationResult,
  processPaginationResults,
} from "../utils/paginationUtils";
import { getVideoThumbnailUrl } from "../utils/videoUtils";
import { readThroughFirestoreCache } from "./firestoreReadCache";

const CACHE_KEY = LOCAL_CACHE_KEYS.trending;
const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;

export type TrendingLessonRecord = {
  id: string;
  title: string;
  teacher: string;
  duration: string;
  thumbnail: string;
  subject: string;
  link: string;
  description: string;
  avatar: string;
  uploadedAt?: string;
  visits: number;
  owner?: string;
};

type FirestoreLesson = Record<string, unknown>;
let inFlight: Promise<TrendingLessonRecord[]> | null = null;

function dateToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "object" && value !== null) {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000).toISOString();
    }
  }
  return undefined;
}

function normalizeLesson(
  raw: FirestoreLesson,
  id: string,
  index: number,
): TrendingLessonRecord {
  const link = typeof raw.link === "string" ? raw.link : "";
  const visits = Number(raw.visits);
  return {
    id: String(raw.id ?? id ?? `lesson-${index}`),
    title: String(raw.title ?? "Untitled lesson"),
    teacher: String(raw.teacher ?? "Teacher"),
    duration: String(raw.duration ?? "00:00"),
    thumbnail: getVideoThumbnailUrl(
      typeof raw.thumbnail === "string" ? raw.thumbnail : undefined,
      link,
    ),
    subject: Array.isArray(raw.subject)
      ? raw.subject.join(", ") || "General"
      : String(raw.subject ?? "General"),
    link,
    description: String(raw.description ?? ""),
    avatar: String(raw.avatar ?? ""),
    uploadedAt: dateToString(raw.uploadedAt),
    visits: Number.isFinite(visits) && visits >= 0 ? visits : 0,
    owner: typeof raw.owner === "string" ? raw.owner : undefined,
  };
}

export async function loadTrendingLessons(
  force = false,
): Promise<TrendingLessonRecord[]> {
  const cached = await readLocalCache<TrendingLessonRecord[]>(
    CACHE_KEY,
    CACHE_VERSION,
  );
  if (cached && !force && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }
  if (inFlight) return inFlight;

  inFlight = readThroughFirestoreCache(
    "collection:trendingLessons",
    () => getDocs(collection(db, "trendingLessons")),
    { ttlMs: CACHE_MAX_AGE_MS, force },
  )
    .then((snapshot) =>
      snapshot.docs.map((doc, index) =>
        normalizeLesson(doc.data(), doc.id, index),
      ),
    )
    .then(async (lessons) => {
      await writeLocalCache(CACHE_KEY, lessons, CACHE_VERSION);
      return lessons;
    })
    .catch((error) => {
      if (cached) return cached.data;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Load trending lessons with cursor-based pagination
 * Reduces database reads by only fetching required records
 */
export async function loadTrendingLessonsPaginated(
  pageSize: number = 20,
  cursor?: DocumentSnapshot,
): Promise<PaginationResult<TrendingLessonRecord>> {
  const collectionRef = collection(db, "trendingLessons");

  let q = query(collectionRef, orderBy("uploadedAt", "desc"));

  if (cursor) {
    q = query(collectionRef, orderBy("uploadedAt", "desc"), startAfter(cursor));
  }

  q = query(q, limit(pageSize + 1));

  try {
    const snapshot = await getDocs(q);
    return processPaginationResults(snapshot.docs, pageSize, (doc) =>
      normalizeLesson(
        (doc.data() ?? {}) as FirestoreLesson,
        doc.id,
        snapshot.docs.findIndex((item) => item.id === doc.id),
      ),
    );
  } catch (error) {
    console.error("Error loading paginated trending lessons:", error);
    throw error;
  }
}
