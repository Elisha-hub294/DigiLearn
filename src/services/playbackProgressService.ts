import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYBACK_PREFIX = "@digilearn_playback_progress_";
const MAX_RECENTS = 15;

export interface PlaybackProgress {
  lessonId: string;
  positionSeconds: number;
  durationSeconds?: number;
  title?: string;
  subject?: string;
  teacher?: string;
  thumbnail?: string;
  link?: string;
  duration?: string;
  updatedAt: number;
}

export function formatPlaybackTime(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export async function saveLessonProgress(
  lessonId: string,
  positionSeconds: number,
  metadata?: {
    durationSeconds?: number;
    title?: string;
    subject?: string;
    teacher?: string;
    thumbnail?: string;
    link?: string;
    duration?: string;
  },
): Promise<void> {
  if (!lessonId || positionSeconds <= 0) return;

  try {
    const data: PlaybackProgress = {
      lessonId,
      positionSeconds: Math.floor(positionSeconds),
      durationSeconds: metadata?.durationSeconds
        ? Math.floor(metadata.durationSeconds)
        : undefined,
      title: metadata?.title,
      subject: metadata?.subject,
      teacher: metadata?.teacher,
      thumbnail: metadata?.thumbnail,
      link: metadata?.link,
      duration: metadata?.duration,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(`${PLAYBACK_PREFIX}${lessonId}`, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to save lesson progress:", error);
    }
  }
}

export async function getLessonProgress(
  lessonId: string,
): Promise<PlaybackProgress | null> {
  if (!lessonId) return null;

  try {
    const raw = await AsyncStorage.getItem(`${PLAYBACK_PREFIX}${lessonId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaybackProgress;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAllRecentProgress(): Promise<PlaybackProgress[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const playbackKeys = allKeys.filter((k) => k.startsWith(PLAYBACK_PREFIX));
    if (playbackKeys.length === 0) return [];

    const keyPairs = await AsyncStorage.multiGet(playbackKeys);
    const results: PlaybackProgress[] = [];

    for (const [, val] of keyPairs) {
      if (val) {
        try {
          const parsed = JSON.parse(val) as PlaybackProgress;
          if (parsed && parsed.lessonId && parsed.title) {
            results.push(parsed);
          }
        } catch {
          // ignore corrupted items
        }
      }
    }

    return results
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, MAX_RECENTS);
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to get all recent progress:", error);
    }
    return [];
  }
}

export async function clearLessonProgress(lessonId: string): Promise<void> {
  if (!lessonId) return;

  try {
    await AsyncStorage.removeItem(`${PLAYBACK_PREFIX}${lessonId}`);
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear lesson progress:", error);
    }
  }
}
