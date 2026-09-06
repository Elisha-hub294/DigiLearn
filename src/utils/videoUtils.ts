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

/**
 * Builds a valid YouTube embed URL with optional starting timestamp.
 */
export function getYoutubeEmbedUrl(
  rawUrl?: string,
  startSeconds?: number,
): string {
  if (!rawUrl) return "";
  const id = extractYoutubeId(rawUrl);
  if (!id) return rawUrl.trim();

  const base = `https://www.youtube.com/embed/${id}`;
  if (startSeconds && startSeconds > 0) {
    return `${base}?start=${Math.floor(startSeconds)}`;
  }
  return base;
}

/**
 * Checks if a string is a valid YouTube video URL.
 */
export function isValidYouTubeVideoUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const videoId = extractYoutubeId(trimmed);
  if (!videoId) return false;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host.endsWith(".youtube.com")
    );
  } catch {
    return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)/i.test(
      trimmed,
    );
  }
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

/**
 * Parses ISO 8601 duration (e.g. PT1H2M30S, PT15M33S, PT45S) into total seconds.
 */
export function parseIsoDuration(durationStr?: string): number | null {
  if (!durationStr || typeof durationStr !== "string") return null;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/**
 * Formats a duration in seconds to MM:SS or HH:MM:SS.
 */
export function formatDurationFromSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/**
 * Attempts to fetch a YouTube video's duration directly from multiple reliable endpoints.
 */
export async function fetchYoutubeDurationDirectly(
  videoId: string,
): Promise<string | null> {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  // Strategy 1: YouTube InnerTube API (TVHTML5 and WEB clients)
  const innertubeClients = [
    { clientName: "TVHTML5", clientVersion: "7.20250101.08.00" },
    { clientName: "WEB", clientVersion: "2.20250101.00.00" },
  ];

  for (const client of innertubeClients) {
    try {
      const playerResponse = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            context: { client },
          }),
        },
      );
      if (playerResponse.ok) {
        const playerData = (await playerResponse.json()) as {
          videoDetails?: { lengthSeconds?: string };
        };
        const playerSeconds = Number(
          playerData.videoDetails?.lengthSeconds ?? 0,
        );
        if (Number.isFinite(playerSeconds) && playerSeconds > 0) {
          return formatDurationFromSeconds(playerSeconds);
        }
      }
    } catch {}
  }

  // Strategy 2: Direct YouTube watch page scrape
  try {
    const watchResponse = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
    );
    if (watchResponse.ok) {
      const html = await watchResponse.text();

      // Check Schema.org itemprop="duration" content="PT...S"
      const itempropMatch = html.match(
        /itemprop="duration"\s+content="([^"]+)"/i,
      );
      if (itempropMatch?.[1]) {
        const seconds = parseIsoDuration(itempropMatch[1]);
        if (seconds && seconds > 0) {
          return formatDurationFromSeconds(seconds);
        }
      }

      // Check approxDurationMs
      const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (approxMatch?.[1]) {
        const ms = Number(approxMatch[1]);
        if (Number.isFinite(ms) && ms > 0) {
          return formatDurationFromSeconds(Math.round(ms / 1000));
        }
      }

      // Check lengthSeconds
      const lengthMatch =
        html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
        html.match(/\\?"lengthSeconds\\?"\s*:\s*\\?"(\d+)\\?"/) ||
        html.match(/&quot;lengthSeconds&quot;\s*:\s*&quot;(\d+)&quot;/);
      if (lengthMatch?.[1]) {
        const sec = Number(lengthMatch[1]);
        if (Number.isFinite(sec) && sec > 0) {
          return formatDurationFromSeconds(sec);
        }
      }
    }
  } catch {}

  return null;
}

export type YoutubeVideoMeta = {
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
};

/**
 * Fetches comprehensive metadata for a YouTube video using multiple resilient strategies.
 */
export async function fetchYoutubeVideoMeta(
  videoUrl: string,
  functionsCaller?: (videoId: string) => Promise<string | null>,
): Promise<YoutubeVideoMeta> {
  const fallbackThumb = "https://img.youtube.com/vi/unknown/hqdefault.jpg";
  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) {
    return { title: "", description: "", duration: "", thumbnail: fallbackThumb };
  }

  const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let title = "";
  let description = "";
  let duration = "";
  let thumbnail = defaultThumbnail;

  // 1. Try YouTube Data API v3 if API key is provided
  const apiKey =
    process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    "";

  if (apiKey) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`,
      );
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        if (item) {
          title = item.snippet?.title || "";
          description = item.snippet?.description || "";
          const durationISO = item.contentDetails?.duration;
          if (durationISO) {
            const seconds = parseIsoDuration(durationISO);
            if (seconds) {
              duration = formatDurationFromSeconds(seconds);
            }
          }
          if (title && duration) {
            return { title, description, duration, thumbnail };
          }
        }
      }
    } catch {}
  }

  // 2. Try fetching duration directly from YouTube InnerTube / watch page
  try {
    const directDuration = await fetchYoutubeDurationDirectly(videoId);
    if (directDuration && directDuration !== "00:00") {
      duration = directDuration;
    }
  } catch {}

  // 3. If direct fetch didn't obtain duration, try Cloud Function if caller passed
  if ((!duration || duration === "00:00") && functionsCaller) {
    try {
      const serverDur = await functionsCaller(videoId);
      if (serverDur && serverDur !== "00:00") {
        duration = serverDur;
      }
    } catch {}
  }

  // 4. Fetch oEmbed for title and best thumbnail if title isn't known yet
  if (!title) {
    try {
      const oEmbedResponse = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      );
      if (oEmbedResponse.ok) {
        const data = await oEmbedResponse.json();
        if (typeof data.title === "string") {
          title = data.title;
        }
        if (typeof data.thumbnail_url === "string") {
          thumbnail = data.thumbnail_url;
        }
      }
    } catch {}
  }

  // 5. If title is still empty, try InnerTube WEB player info for title and description
  if (!title) {
    try {
      const playerResponse = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            context: {
              client: { clientName: "WEB", clientVersion: "2.20250101.00.00" },
            },
          }),
        },
      );
      if (playerResponse.ok) {
        const playerData = (await playerResponse.json()) as {
          videoDetails?: {
            title?: string;
            shortDescription?: string;
            lengthSeconds?: string;
          };
        };
        if (playerData.videoDetails?.title) {
          title = playerData.videoDetails.title;
        }
        if (playerData.videoDetails?.shortDescription) {
          description = playerData.videoDetails.shortDescription;
        }
        if (!duration && playerData.videoDetails?.lengthSeconds) {
          const s = Number(playerData.videoDetails.lengthSeconds);
          if (Number.isFinite(s) && s > 0) {
            duration = formatDurationFromSeconds(s);
          }
        }
      }
    } catch {}
  }

  return {
    title,
    description,
    duration,
    thumbnail: thumbnail || defaultThumbnail,
  };
}

