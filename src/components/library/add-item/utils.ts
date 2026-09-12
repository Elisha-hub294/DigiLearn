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
 * Converts base64 content to a Blob object.
 * This is required for native file URIs, where XHR cannot fetch file:// URLs.
 */
export const base64ToBlob = (
  base64: string,
  mimeType = "application/octet-stream",
): Blob => {
  const normalized = base64.includes(",") ? base64.split(",")[1] : base64;
  const cleaned = normalized.replace(/\s/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
};

/**
 * Converts a local or remote file URI into a Blob.
 * Native file URIs must be read as base64 because XMLHttpRequest cannot fetch
 * file:// URIs on Android/iOS.
 */
export const uriToBlob = async (uri: string): Promise<Blob> => {
  if (!uri) {
    throw new Error("File URI is required");
  }

  if (uri.startsWith("data:")) {
    const [header, payload] = uri.split(",");
    const mimeType =
      header.match(/data:([^;]+);base64/i)?.[1] || "application/octet-stream";
    return base64ToBlob(payload || "", mimeType);
  }

  const isNativeFileUri = /^(file:|content:|ph:|assets-library:)/i.test(uri);

  if (isNativeFileUri) {
    let FileSystem: any = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      FileSystem = require("expo-file-system");
    } catch (error) {
      console.error("Failed to load expo-file-system for native upload", error);
      throw new Error(
        "Expo FileSystem is not available for this native upload.",
      );
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mimeType = uri.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/octet-stream";
    return base64ToBlob(base64, mimeType);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
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
