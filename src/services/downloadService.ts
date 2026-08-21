import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export interface DownloadedFile {
  id: string;
  title: string;
  uri: string;
  localUri: string;
  downloadedAt: number;
  fileSize?: number;
}

const STORAGE_KEY = "@digilearn_downloaded_files";

export async function getDownloadedFiles(): Promise<DownloadedFile[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const files: DownloadedFile[] = JSON.parse(json);
    return Array.isArray(files) ? files : [];
  } catch (error) {
    console.error("Error reading downloaded files:", error);
    return [];
  }
}

export async function saveDownloadedFile(
  file: Omit<DownloadedFile, "id" | "downloadedAt">
): Promise<DownloadedFile> {
  try {
    const existing = await getDownloadedFiles();

    // Check if item already exists by uri or title to prevent duplicates
    const filtered = existing.filter(
      (f) => f.uri !== file.uri && f.localUri !== file.localUri
    );

    const newEntry: DownloadedFile = {
      ...file,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      downloadedAt: Date.now(),
    };

    const updated = [newEntry, ...filtered];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (error) {
    console.error("Error saving downloaded file:", error);
    throw error;
  }
}

export async function removeDownloadedFile(id: string): Promise<void> {
  try {
    const existing = await getDownloadedFiles();
    const target = existing.find((f) => f.id === id);

    if (target && Platform.OS !== "web" && target.localUri) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(target.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(target.localUri, { idempotent: true });
        }
      } catch (err) {
        console.warn("Failed to delete local file from disk:", err);
      }
    }

    const updated = existing.filter((f) => f.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error removing downloaded file:", error);
  }
}

export async function clearAllDownloadedFiles(): Promise<void> {
  try {
    const existing = await getDownloadedFiles();
    if (Platform.OS !== "web") {
      for (const file of existing) {
        if (file.localUri) {
          try {
            await FileSystem.deleteAsync(file.localUri, { idempotent: true });
          } catch {}
        }
      }
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing downloaded files:", error);
  }
}
