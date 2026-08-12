import { ImageSourcePropType } from "react-native";

const FALLBACK_THUMBNAIL = require("../../assets/images/thumb-default.jpeg");

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

  return FALLBACK_THUMBNAIL;
}
