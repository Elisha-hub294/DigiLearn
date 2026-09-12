import { Image } from "expo-image";
import { Platform } from "react-native";

const STARTUP_CACHE_URLS = [
  "https://digilearn-af86d.firebasestorage.app/",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/icons%2Fdefault-2d.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/icons%2Fdefault-3d.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/subject-default.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/panda.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/welcome.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/bookcover-default.png?alt=media",
  "https://firebasestorage.googleapis.com/v0/b/digilearn-af86d.firebasestorage.app/o/user-default.png?alt=media",
] as const;

const IMAGE_CACHE_POLICY = "disk" as const;

function normalizeStartupUrls(urls: Iterable<string>): string[] {
  return Array.from(
    new Set(
      Array.from(urls).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );
}

export async function prefetchNativeUrl(url: string): Promise<boolean> {
  if (!url || Platform.OS === "web") return true;

  try {
    return await Image.prefetch(url, { cachePolicy: IMAGE_CACHE_POLICY });
  } catch (error) {
    console.warn("Unable to warm native image cache for startup asset", error);
    return false;
  }
}

export async function warmNativeStartupCache(
  urls: Iterable<string> = STARTUP_CACHE_URLS,
): Promise<boolean> {
  if (Platform.OS === "web") return true;

  const uniqueUrls = normalizeStartupUrls(urls);
  if (uniqueUrls.length === 0) return true;

  const results = await Promise.all(
    uniqueUrls.map(async (url) => prefetchNativeUrl(url)),
  );

  return results.every(Boolean);
}
