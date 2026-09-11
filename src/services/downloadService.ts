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
  if (!blob) return null;

  // Earlier web downloads were stored as application/octet-stream. Chrome
  // does not reliably hand such blob URLs to its PDF viewer, even when the
  // bytes are a valid PDF. Preserve an explicit type when one exists and
  // repair those legacy generic downloads on read.
  const readableBlob =
    !blob.type || blob.type === "application/octet-stream"
      ? new Blob([blob], { type: "application/pdf" })
      : blob;
  return URL.createObjectURL(readableBlob);
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

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const localUri =
      Platform.OS === "web" && file.webBlob
        ? `indexeddb://${id}`
        : file.localUri;

    const newEntry: DownloadedFile = {
      title: file.title,
      uri: file.uri,
      localUri,
      fileSize: file.fileSize,
      id,
      downloadedAt: Date.now(),
    };

    // The Downloads screen validates every registry entry. Persist the web
    // blob before publishing its entry so a focused Downloads screen never
    // sees a temporarily missing file and removes the new download.
    if (file.webBlob) {
      await saveWebBlob(id, file.webBlob);
    }

    const updated = [newEntry, ...filtered];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Remove blobs that were replaced by this download. This keeps the web
    // cache aligned with the registry when a resource is downloaded again.
    if (Platform.OS === "web" && typeof indexedDB !== "undefined") {
      const replaced = existing.filter(
        (entry) => entry.uri === file.uri || entry.localUri === file.localUri,
      );
      await Promise.all(
        replaced.map((entry) =>
          entry.localUri.startsWith("indexeddb://")
            ? deleteWebBlob(entry.localUri.substring("indexeddb://".length))
            : Promise.resolve(),
        ),
      );
    }
    return newEntry;
  } catch (error) {
    console.error("Error saving downloaded file:", error);
    throw error;
  }
}

async function deleteWebBlob(id: string): Promise<void> {
  if (Platform.OS !== "web" || typeof indexedDB === "undefined") return;
  const database = await openWebDatabase();
  await new Promise<void>((resolve) => {
    const transaction = database.transaction(WEB_STORE_NAME, "readwrite");
    transaction.objectStore(WEB_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
  database.close();
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
      await deleteWebBlob(target.localUri.substring("indexeddb://".length));
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
