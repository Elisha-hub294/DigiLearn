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
import { readThroughFirestoreCache } from "./firestoreReadCache";

const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type BookRecord = {
  id: string;
  title: string;
  author: string;
  subject: string;
  image: string;
  owner?: string;
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
          owner: text(data.owner, "") || undefined,
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

/**
 * Load books with cursor-based pagination
 * Reduces database reads by only fetching required records
 */
export async function loadBooksPaginated(
  pageSize: number = 20,
  cursor?: DocumentSnapshot,
): Promise<PaginationResult<BookRecord>> {
  const collectionRef = collection(db, "books");

  let q = query(collectionRef, orderBy("title"));

  if (cursor) {
    q = query(collectionRef, orderBy("title"), startAfter(cursor));
  }

  q = query(q, limit(pageSize + 1));

  try {
    const snapshot = await getDocs(q);
    return processPaginationResults(snapshot.docs, pageSize, (doc) => {
      const data = doc.data() as Record<string, unknown>;
      const index = snapshot.docs.findIndex((item) => item.id === doc.id);
      return {
        id: doc.id || `book-${index}`,
        title: text(data.title ?? data.name ?? data.bookTitle, "Untitled book"),
        author: text(
          data.author ?? data.writer ?? data.publisher,
          "Unknown author",
        ),
        subject: text(data.subject ?? data.category, ""),
        image: text(
          data.image ?? data.coverImage ?? data.cover ?? data.thumbnail,
          "",
        ),
        owner: text(data.owner, "") || undefined,
      };
    });
  } catch (error) {
    console.error("Error loading paginated books:", error);
    throw error;
  }
}
