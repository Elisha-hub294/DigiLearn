import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  LOCAL_CACHE_KEYS,
  readLocalCache,
  writeLocalCache,
} from "../utils/localCache";
import { readThroughFirestoreCache } from "./firestoreReadCache";

const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type BookRecord = {
  id: string;
  title: string;
  author: string;
  subject: string;
  image: string;
};

let inFlight: Promise<BookRecord[]> | null = null;

const text = (value: unknown, fallback: string): string => {
  if (Array.isArray(value)) return text(value[0], fallback);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export async function loadBooks(force = false): Promise<BookRecord[]> {
  const cached = await readLocalCache<BookRecord[]>(
    LOCAL_CACHE_KEYS.books,
    CACHE_VERSION,
  );
  if (cached && !force && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }
  if (inFlight) return inFlight;

  inFlight = readThroughFirestoreCache(
    "collection:books",
    () => getDocs(collection(db, "books")),
    { force },
  )
    .then((snapshot) =>
      snapshot.docs.map((doc, index) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id || `book-${index}`,
          title: text(
            data.title ?? data.name ?? data.bookTitle,
            "Untitled book",
          ),
          author: text(
            data.author ?? data.writer ?? data.publisher,
            "Unknown author",
          ),
          subject: text(data.subject ?? data.category, ""),
          image: text(
            data.image ?? data.coverImage ?? data.cover ?? data.thumbnail,
            "",
          ),
        };
      }),
    )
    .then(async (books) => {
      await writeLocalCache(LOCAL_CACHE_KEYS.books, books, CACHE_VERSION);
      return books;
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
