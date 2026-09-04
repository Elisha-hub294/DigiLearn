import AsyncStorage from "@react-native-async-storage/async-storage";

type CacheEnvelope<T> = {
  version: number;
  savedAt: number;
  data: T;
};

export async function readLocalCache<T>(
  key: string,
  version = 1,
): Promise<{ data: T; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CacheEnvelope<T>;
    if (cached.version !== version || typeof cached.savedAt !== "number") {
      return null;
    }

    return { data: cached.data, savedAt: cached.savedAt };
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
    await AsyncStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn(`Unable to write local cache: ${key}`, error);
  }
}
