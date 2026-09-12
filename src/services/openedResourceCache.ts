import AsyncStorage from "@react-native-async-storage/async-storage";

export type OpenedResourceType = "book" | "page" | "paper" | "lesson";

export type CachedOpenedResource = {
  id: string;
  type: OpenedResourceType;
  data: Record<string, unknown>;
  cachedAt: number;
};

const RESOURCE_CACHE_KEY = "@digilearn_opened_resources_v1";
const RESOURCE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function readResourceStore(): Promise<
  Record<string, CachedOpenedResource>
> {
  try {
    const raw = await AsyncStorage.getItem(RESOURCE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedOpenedResource>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

async function writeResourceStore(
  store: Record<string, CachedOpenedResource>,
): Promise<void> {
  try {
    await AsyncStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Ignore cache persistence failures; the app should still function.
  }
}

export async function saveOpenedResourceCache(
  type: OpenedResourceType,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!type || !id || !data || typeof data !== "object") return;

  const store = await readResourceStore();
  const cacheKey = `${type}:${id}`;
  store[cacheKey] = {
    id,
    type,
    data,
    cachedAt: Date.now(),
  };

  await writeResourceStore(store);
}

export async function getOpenedResourceCache<T extends Record<string, unknown>>(
  type: OpenedResourceType,
  id: string,
): Promise<T | null> {
  if (!type || !id) return null;

  const store = await readResourceStore();
  const cacheKey = `${type}:${id}`;
  const entry = store[cacheKey];

  if (!entry) return null;

  if (Date.now() - entry.cachedAt > RESOURCE_CACHE_TTL_MS) {
    delete store[cacheKey];
    await writeResourceStore(store);
    return null;
  }

  return (entry.data as T) ?? null;
}

export async function getRecentOpenedResources(
  limit = 10,
): Promise<CachedOpenedResource[]> {
  const store = await readResourceStore();
  const entries = Object.values(store)
    .filter((entry) => Date.now() - entry.cachedAt <= RESOURCE_CACHE_TTL_MS)
    .sort((a, b) => b.cachedAt - a.cachedAt)
    .slice(0, limit);

  return entries;
}

export async function clearOpenedResourceCache(
  type?: OpenedResourceType,
  id?: string,
): Promise<void> {
  const store = await readResourceStore();

  if (!type && !id) {
    await AsyncStorage.removeItem(RESOURCE_CACHE_KEY);
    return;
  }

  const keysToRemove = Object.keys(store).filter((key) => {
    if (type && id) return key === `${type}:${id}`;
    if (type) return key.startsWith(`${type}:`);
    return key.endsWith(`:${id}`);
  });

  keysToRemove.forEach((key) => delete store[key]);
  await writeResourceStore(store);
}
