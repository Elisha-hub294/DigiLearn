import { ImageSourcePropType } from "react-native";
import { getThemeAsset } from "../constants/themeAssets";

const FALLBACK_THUMBNAIL = getThemeAsset("thumbDefault", false);

type FirestoreTimestampLike = {
  seconds?: unknown;
  toDate?: () => Date;
};

/** Converts Firestore timestamps to text that can safely be rendered in React. */
export function formatVideoUploadedAt(value: unknown): string {
  if (typeof value === "string") return value;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString();
  }

  if (typeof value === "object" && value !== null) {
    const timestamp = value as FirestoreTimestampLike;
    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    if (typeof timestamp.seconds === "number") {
      const date = new Date(timestamp.seconds * 1000);
      if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
    }
  }

  return "";
}

/**
 * Extracts YouTube video ID from various YouTube URL formats.
 */
export function extractYoutubeId(url?: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  // 2. Short URL: youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([^?#&]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  // 3. Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?#&]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  // 4. Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^?#&]+)/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  // 5. Direct v/ URL: youtube.com/v/VIDEO_ID
  const vMatch = trimmed.match(/youtube\.com\/v\/([^?#&]+)/);
  if (vMatch?.[1]) return vMatch[1];

  // 6. img.youtube.com or i.ytimg.com URL: img.youtube.com/vi/VIDEO_ID/...
  const ytImgMatch = trimmed.match(
    /(?:img\.youtube\.com|i\.ytimg\.com)\/vi\/([^/]+)/,
  );
  if (ytImgMatch?.[1]) return ytImgMatch[1];

  return null;
}

export type VideoLinkCheck =
  | { valid: true }
  | { valid: false; message: string };

/** Validates a lesson link before it is passed to the external video player. */
export async function validateVideoLink(
  rawUrl?: string,
): Promise<VideoLinkCheck> {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) {
    return {
      valid: false,
      message: "This lesson does not have a video link yet.",
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      valid: false,
      message: "This lesson has an invalid video link.",
    };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      valid: false,
      message: "This lesson has an invalid video link.",
    };
  }

  if (!extractYoutubeId(trimmed)) {
    return { valid: true };
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`,
    );
    if (response.ok) {
      return { valid: true };
    }
  } catch {
    return {
      valid: false,
      message: "We couldn't verify this YouTube video. Please try again.",
    };
  }

  return {
    valid: false,
    message: "This YouTube video is no longer available.",
  };
}

/**
 * Resolves the best available remote image URL for a video.
 * Checks thumbnail parameter first, then link parameter for YouTube video ID.
 */
export function getVideoThumbnailUrl(
  thumbnail?: string,
  link?: string,
): string {
  // 1. First inspect thumbnail string
  if (thumbnail && typeof thumbnail === "string") {
    const trimmed = thumbnail.trim();
    if (trimmed.length > 0) {
      // Check if thumbnail is a YouTube link or YouTube image
      const ytId = extractYoutubeId(trimmed);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
      // If it's a valid remote URL or data URI, return as-is
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:")
      ) {
        return trimmed;
      }
    }
  }

  // 2. If thumbnail wasn't a valid image/URL, check link for YouTube video ID or direct image URL
  if (link && typeof link === "string") {
    const trimmed = link.trim();
    if (trimmed.length > 0) {
      const ytId = extractYoutubeId(trimmed);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
      if (
        (trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
        /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(trimmed)
      ) {
        return trimmed;
      }
    }
  }

  return "";
}

/**
 * Resolves image source object or numeric require(...) for Image component.
 */
export function resolveVideoImageSource(
  thumbnail?: string | number,
  link?: string,
  isDark = false,
): ImageSourcePropType {
  if (typeof thumbnail === "number") {
    return thumbnail;
  }

  const url = getVideoThumbnailUrl(
    typeof thumbnail === "string" ? thumbnail : undefined,
    link,
  );

  if (url) {
    return { uri: url };
  }

  return isDark ? getThemeAsset("thumbDefault", true) : FALLBACK_THUMBNAIL;
}
