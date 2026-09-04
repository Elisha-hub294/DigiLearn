import AsyncStorage from "@react-native-async-storage/async-storage";

type CacheEnvelope<T> = {
  version: number;
  savedAt: number;
  data: T;
};

const MAX_CACHE_BYTES = 2_000_000;

export const LOCAL_CACHE_KEYS = {
  library: "digilearn-library-data",
  books: "digilearn-books",
  search: "digilearn-search-index",
  subjects: "digilearn-subjects",
  trending: "digilearn-trending-lessons",
} as const;

export async function readLocalCache<T>(
  key: string,
  version = 1,
): Promise<{ data: T; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const cached: unknown = JSON.parse(raw);
    if (
      typeof cached !== "object" ||
      cached === null ||
      (cached as CacheEnvelope<T>).version !== version ||
      typeof (cached as CacheEnvelope<T>).savedAt !== "number" ||
      !("data" in cached)
    ) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      data: (cached as CacheEnvelope<T>).data,
      savedAt: (cached as CacheEnvelope<T>).savedAt,
    };
  } catch (error) {
    console.warn(`Unable to read local cache: ${key}`, error);
    return null;
  }
}

export async function writeLocalCache<T>(
  key: string,
  data: T,
  version = 1,
): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = {
      version,
      savedAt: Date.now(),
      data,
    };
    const serialized = JSON.stringify(envelope);
    if (serialized.length > MAX_CACHE_BYTES) {
      console.warn(`Skipping oversized local cache: ${key}`);
      return;
    }
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Unable to write local cache: ${key}`, error);
  }
}

export async function invalidateLocalCaches(...keys: string[]): Promise<void> {
  await Promise.all(
    keys.map(async (key) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn(`Unable to invalidate local cache: ${key}`, error);
      }
    }),
  );
}
