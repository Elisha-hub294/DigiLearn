import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
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
const WEB_DB_NAME = "digilearn-downloads";
const WEB_STORE_NAME = "files";

type DownloadedFileInput = Omit<DownloadedFile, "id" | "downloadedAt"> & {
  webBlob?: Blob;
};

function openWebDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WEB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(WEB_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveWebBlob(id: string, blob: Blob): Promise<void> {
  if (Platform.OS !== "web" || typeof indexedDB === "undefined") return;
  const database = await openWebDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WEB_STORE_NAME, "readwrite");
    transaction.objectStore(WEB_STORE_NAME).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function hasWebBlob(id: string): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  const database = await openWebDatabase();
  const exists = await new Promise<boolean>((resolve, reject) => {
    const request = database
      .transaction(WEB_STORE_NAME, "readonly")
      .objectStore(WEB_STORE_NAME)
      .getKey(id);
    request.onsuccess = () => resolve(request.result !== undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return exists;
}

export async function getWebDownloadedFileUrl(
  localUri: string,
): Promise<string | null> {
  if (
    Platform.OS !== "web" ||
    !localUri.startsWith("indexeddb://") ||
    typeof indexedDB === "undefined"
  ) {
    return localUri;
  }

  const id = localUri.substring("indexeddb://".length);
  const database = await openWebDatabase();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database
      .transaction(WEB_STORE_NAME, "readonly")
      .objectStore(WEB_STORE_NAME)
      .get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return blob ? URL.createObjectURL(blob) : null;
}

async function isFileAvailable(file: DownloadedFile): Promise<boolean> {
  if (Platform.OS === "web") {
    return file.localUri.startsWith("indexeddb://")
      ? hasWebBlob(file.localUri.substring("indexeddb://".length))
      : false;
  }

  if (!file.localUri?.startsWith("file://")) return false;
  try {
    const info = await FileSystem.getInfoAsync(file.localUri);
    return info.exists;
  } catch {
    return false;
  }
}

export async function getDownloadedFiles(): Promise<DownloadedFile[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const files: DownloadedFile[] = JSON.parse(json);
    if (!Array.isArray(files)) return [];
    const availability = await Promise.all(
      files.map(async (file) => ({
        file,
        available: await isFileAvailable(file),
      })),
    );
    const validFiles = availability
      .filter(({ available }) => available)
      .map(({ file }) => file);
    if (validFiles.length !== files.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validFiles));
    }
    return validFiles;
  } catch (error) {
    console.error("Error reading downloaded files:", error);
    return [];
  }
}

export async function saveDownloadedFile(
  file: DownloadedFileInput,
): Promise<DownloadedFile> {
  try {
    const existing = await getDownloadedFiles();

    // Check if item already exists by uri or title to prevent duplicates
    const filtered = existing.filter(
      (f) => f.uri !== file.uri && f.localUri !== file.localUri,
    );

    const newEntry: DownloadedFile = {
      title: file.title,
      uri: file.uri,
      localUri:
        Platform.OS === "web" && file.webBlob
          ? `indexeddb://${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          : file.localUri,
      fileSize: file.fileSize,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      downloadedAt: Date.now(),
    };

    const updated = [newEntry, ...filtered];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (file.webBlob) {
      await saveWebBlob(
        newEntry.localUri.substring("indexeddb://".length),
        file.webBlob,
      );
    }
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

    if (
      target?.localUri.startsWith("indexeddb://") &&
      typeof indexedDB !== "undefined"
    ) {
      const database = await openWebDatabase();
      await new Promise<void>((resolve) => {
        const transaction = database.transaction(WEB_STORE_NAME, "readwrite");
        transaction
          .objectStore(WEB_STORE_NAME)
          .delete(target.localUri.substring("indexeddb://".length));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
      database.close();
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
    } else if (typeof indexedDB !== "undefined") {
      const database = await openWebDatabase();
      await new Promise<void>((resolve) => {
        const transaction = database.transaction(WEB_STORE_NAME, "readwrite");
        transaction.objectStore(WEB_STORE_NAME).clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
      database.close();
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing downloaded files:", error);
  }
}
