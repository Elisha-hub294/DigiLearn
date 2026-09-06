import AsyncStorage from "@react-native-async-storage/async-storage";

const READING_PROGRESS_PREFIX = "@digilearn_reading_progress_";
const MAX_RECENTS = 20;

export interface ReadingProgress {
  pageId: string;
  lastPage: number;
  totalPages?: number;
  title?: string;
  documentUri?: string;
  subject?: string;
  cover?: string;
  updatedAt: number;
}

export async function savePageReadingProgress(
  pageId: string,
  lastPage: number,
  totalPages?: number,
  metadata?: {
    title?: string;
    documentUri?: string;
    subject?: string;
    cover?: string;
  },
): Promise<void> {
  if (!pageId || lastPage <= 0) return;

  try {
    const existing = await getPageReadingProgress(pageId);
    const data: ReadingProgress = {
      pageId,
      lastPage: Math.floor(lastPage),
      totalPages: totalPages
        ? Math.floor(totalPages)
        : existing?.totalPages
        ? existing.totalPages
        : undefined,
      title: metadata?.title ?? existing?.title,
      documentUri: metadata?.documentUri ?? existing?.documentUri,
      subject: metadata?.subject ?? existing?.subject,
      cover: metadata?.cover ?? existing?.cover,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      `${READING_PROGRESS_PREFIX}${pageId}`,
      JSON.stringify(data),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to save page reading progress:", error);
    }
  }
}

export async function getPageReadingProgress(
  pageId: string,
): Promise<ReadingProgress | null> {
  if (!pageId) return null;

  try {
    const raw = await AsyncStorage.getItem(
      `${READING_PROGRESS_PREFIX}${pageId}`,
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadingProgress;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAllReadingProgress(): Promise<
  Record<string, ReadingProgress>
> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const readingKeys = allKeys.filter((k) =>
      k.startsWith(READING_PROGRESS_PREFIX),
    );
    if (readingKeys.length === 0) return {};

    const keyPairs = await AsyncStorage.multiGet(readingKeys);
    const resultMap: Record<string, ReadingProgress> = {};

    for (const [, val] of keyPairs) {
      if (val) {
        try {
          const parsed = JSON.parse(val) as ReadingProgress;
          if (parsed && parsed.pageId && parsed.lastPage > 0) {
            resultMap[parsed.pageId] = parsed;
          }
        } catch {
          // ignore corrupted items
        }
      }
    }

    return resultMap;
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to get all reading progress:", error);
    }
    return {};
  }
}

export async function getRecentReadingProgressList(): Promise<
  ReadingProgress[]
> {
  const map = await getAllReadingProgress();
  return Object.values(map)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, MAX_RECENTS);
}

export async function clearPageReadingProgress(
  pageId: string,
): Promise<void> {
  if (!pageId) return;

  try {
    await AsyncStorage.removeItem(`${READING_PROGRESS_PREFIX}${pageId}`);
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear reading progress:", error);
    }
  }
}
