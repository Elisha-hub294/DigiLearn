import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  LOCAL_CACHE_KEYS,
  readLocalCache,
  writeLocalCache,
} from "../utils/localCache";

const CACHE_KEY = LOCAL_CACHE_KEYS.subjects;
const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SubjectRecord = {
  id: string;
  name: string;
  [key: string]: unknown;
};

let inFlight: Promise<SubjectRecord[]> | null = null;

export async function loadSubjects(force = false): Promise<SubjectRecord[]> {
  const cached = await readLocalCache<SubjectRecord[]>(
    CACHE_KEY,
    CACHE_VERSION,
  );
  if (cached && !force && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }
  if (inFlight) return inFlight;

  inFlight = getDocs(collection(db, "subject"))
    .then((snapshot) => {
      const seen = new Set<string>();
      return snapshot.docs.reduce<SubjectRecord[]>((subjects, doc) => {
        const data = doc.data() as Record<string, unknown>;
        const name = typeof data.name === "string" ? data.name.trim() : "";
        const key = name.toLocaleLowerCase();
        if (name && !seen.has(key)) {
          seen.add(key);
          subjects.push({ id: doc.id, ...data, name });
        }
        return subjects;
      }, []);
    })
    .then(async (subjects) => {
      await writeLocalCache(CACHE_KEY, subjects, CACHE_VERSION);
      return subjects;
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
