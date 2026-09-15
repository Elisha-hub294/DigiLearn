/**
 * Normalizes text by removing control characters and extra whitespace
 */
export const normalizeText = (value: string): string =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Generates a safe document ID from a title
 */
export const getTitleDocId = (title: string): string => {
  const sanitized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || `untitled-${Date.now()}`;
};

/**
 * Converts base64 content to a native Blob by fetching a data: URI.
 *
 * React Native's BlobManager.createFromParts() explicitly rejects
 * ArrayBuffer/ArrayBufferView inputs, so `new Blob([uint8Array])` always throws
 * on native. Fetching a data: URI with responseType="blob" routes through
 * React Native's native networking layer which produces a proper Blob that
 * Firebase Storage can wrap and upload via multipart or resumable upload.
 */
export const base64ToBlob = (
  base64: string,
  mimeType = "application/octet-stream",
): Blob | Uint8Array | Promise<Blob> => {
  const normalized = base64.includes(",") ? base64.split(",")[1] : base64;
  const cleaned = normalized.replace(/\s/g, "");
  const dataUri = `data:${mimeType};base64,${cleaned}`;

  // Browsers and Node-based tests can make a Blob directly. Native takes the
  // XMLHttpRequest branch below because React Native does not accept typed
  // arrays in its Blob constructor.
  if (typeof XMLHttpRequest === "undefined") {
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    try {
      return new Blob([bytes], { type: mimeType });
    } catch {
      const nativeSafeBytes = bytes as Uint8Array & {
        type?: string;
        size?: number;
      };
      nativeSafeBytes.type = mimeType;
      nativeSafeBytes.size = bytes.byteLength;
      return nativeSafeBytes;
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function () {
      reject(new Error("Failed to convert base64 to Blob via data: URI fetch"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", dataUri, true);
    xhr.send(null);
  });
};

/**
 * Converts a local or remote file URI into a Blob.
 * Native file URIs (file://, content://, ph://, assets-library://) are read
 * as base64 via expo-file-system, then converted to a proper Blob by fetching
 * a data: URI — this avoids React Native BlobManager's ArrayBufferView
 * restriction and produces a Blob that Firebase Storage can upload correctly.
 */
export const uriToBlob = async (
  uri: string,
  expectedMimeType?: string,
): Promise<Blob> => {
  if (!uri) {
    throw new Error("File URI is required");
  }

  if (uri.startsWith("data:")) {
    const [header] = uri.split(",");
    const mimeType =
      expectedMimeType ||
      header.match(/data:([^;]+);base64/i)?.[1] ||
      "application/octet-stream";
    // Re-fetch the data: URI as a blob to get a proper React Native Blob
    return (await base64ToBlob(uri, mimeType)) as Blob;
  }

  const isNativeFileUri = /^(file:|content:|ph:|assets-library:)/i.test(uri);

  if (isNativeFileUri) {
    try {
      // Expo File is Blob-compatible on native. Keep the PDF on disk rather
      // than expanding it to base64 before Firebase's resumable upload.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { File } = require("expo-file-system");
      const file = new File(uri);
      if (!file.exists) {
        throw new Error("The selected file is no longer available on this device.");
      }
      return file as Blob;
    } catch (error) {
      console.error("Failed to prepare native file for upload", error);
      throw new Error(
        "The selected file could not be accessed. Please choose it again and retry.",
      );
    }

  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function (e) {
      console.error("XHR failed", e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

/**
 * Sanitizes year input to valid year format
 */
export const sanitizeYearInput = (
  value: string,
  currentYear: number,
): string => {
  const numericValue = value.replace(/\D/g, "").slice(0, 4);
  if (!numericValue) return "";

  if (numericValue.length < 4) return numericValue;

  const yearNumber = Number(numericValue);
  if (yearNumber < 1980) return "1980";
  if (yearNumber > currentYear) return String(currentYear);
  return numericValue;
};

/**
 * Sanitizes file name for storage paths
 */
export const sanitizeFileName = (fileName: string): string =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Derives the Firebase Storage subfolder for a past paper by type.
 * If no type is selected, keep the file in the generic folder.
 */
export const getPastPaperStorageFolder = (paperType: string): string => {
  const normalized = normalizeText(paperType || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return normalized ? `past-papers/${normalized}` : "past-papers";
};

/**
 * Generates a unique ID for uploads
 */
export const generateUniqueId = (fileName?: string): string =>
  `${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}${fileName ? `_${fileName}` : ""}`;

/**
 * Cleans file name for title suggestion
 */
export const cleanFileNameForTitle = (fileName: string): string =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Maps error codes to user-friendly messages
 */
export const resolveUploadError = (error: any) => {
  const rawMessage = String(error?.message || error || "");
  const code = String(error?.code || "");
  const combined = `${code} ${rawMessage}`.toLowerCase();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      title: "No internet connection",
      message:
        "Your upload could not finish because the device is offline. Check your connection and try again.",
      primaryText: "Try again",
      inline:
        "No internet connection detected. Please reconnect and try your upload again.",
    };
  }

  if (
    /network|offline|failed to fetch|load failed|interrupted|connection|socket|timeout|timed out|aborted/i.test(
      combined,
    ) ||
    combined.includes("network request failed")
  ) {
    return {
      title: "Upload interrupted",
      message:
        "The upload was interrupted or the connection dropped. Please check your internet connection and try again.",
      primaryText: "Retry upload",
      inline:
        "Upload interrupted. Please check your internet connection and try again.",
    };
  }

  if (
    /permission|unauthorized|forbidden|access denied|storage/i.test(combined) ||
    code === "storage/unauthorized"
  ) {
    return {
      title: "Upload not allowed",
      message:
        "This file could not be uploaded because your account does not have permission or the connection is not valid.",
      primaryText: "Dismiss",
      inline: "Upload permission issue detected. Please try again in a moment.",
    };
  }

  return {
    title: "Upload failed",
    message:
      "We encountered an error while uploading your file. Please check your internet connection and try again.",
    primaryText: "Try again",
    inline:
      "Upload failed. Please check your internet connection and try again.",
  };
};
