import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYBACK_PREFIX = "@digilearn_playback_progress_";
const MAX_RECENTS = 20;

export interface PlaybackProgress {
  lessonId: string;
  positionSeconds: number;
  durationSeconds?: number;
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
  durationSeconds?: number,
): Promise<void> {
  if (!lessonId || positionSeconds <= 0) return;

  try {
    const data: PlaybackProgress = {
      lessonId,
      positionSeconds: Math.floor(positionSeconds),
      durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
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
