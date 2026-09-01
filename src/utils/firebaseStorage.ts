import { getDownloadURL, listAll, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../../firebaseConfig";

// Cache to prevent duplicate getDownloadURL calls
const urlCache = new Map<string, string>();
const urlPromises = new Map<string, Promise<string>>();

/**
 * Resolves a Supabase storage URL or bare storage path to its equivalent Firebase Storage download URL.
 * If the URL is not a Supabase URL or relative storage path, it is returned as is.
 */
async function findStoragePathByFileName(
  fileName: string,
): Promise<string | null> {
  const normalized = fileName.trim().replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return null;
  }

  const candidates = new Set<string>([
    normalized,
    normalized.split("/").pop() || normalized,
  ]);

  const extensionless = (value: string) => {
    const lastSegment = value.split("/").pop() || value;
    const dotIndex = lastSegment.lastIndexOf(".");
    return dotIndex > 0
      ? value.substring(0, value.length - (lastSegment.length - dotIndex))
      : value;
  };

  const rootCandidate = extensionless(normalized);
  if (rootCandidate !== normalized) candidates.add(rootCandidate);

  for (const candidate of Array.from(candidates)) {
    try {
      const resolved = await getDownloadURL(ref(storage, candidate));
      if (resolved) return candidate;
    } catch {
      // continue searching other likely paths below
    }
  }

  const folderCandidates = [
    "icons",
    "subject",
    "subjects",
    "images",
    "avatars",
    "assets",
    "",
  ];

  const basename = normalized.split("/").pop() || normalized;
  const basenameWithoutExt = basename.includes(".")
    ? basename.slice(0, basename.lastIndexOf("."))
    : basename;
  const imageExtensions = [
    "",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
    ".gif",
  ];

  const namesToTry = Array.from(
    new Set([
      basename,
      basenameWithoutExt,
      normalized,
      rootCandidate,
      ...imageExtensions.map((ext) => `${basenameWithoutExt}${ext}`),
    ]),
  );

  for (const folder of folderCandidates) {
    for (const name of namesToTry) {
      const path = folder ? `${folder}/${name}` : name;
      if (path === normalized) continue;
      try {
        const resolved = await getDownloadURL(ref(storage, path));
        if (resolved) return path;
      } catch {
        // continue searching
      }
    }
  }

  // The project stores subject avatars under the icons folder, so prefer that direct path
  // for values like "math-3d" before doing a broader storage walk.
  for (const name of namesToTry) {
    for (const path of [
      `icons/${name}`,
      `icons/${basenameWithoutExt}`,
      `icons/${basename}`,
      `icons/${basenameWithoutExt}.png`,
      `icons/${basename}.png`,
    ]) {
      if (path === normalized) continue;
      try {
        const resolved = await getDownloadURL(ref(storage, path));
        if (resolved) return path;
      } catch {
        // continue searching
      }
    }
  }

  async function walk(prefix: string): Promise<string | null> {
    const currentRef = ref(storage, prefix || "");
    const listing = await listAll(currentRef);

    for (const item of listing.items) {
      const itemName = item.name;
      const itemPath = item.fullPath;
      if (
        itemName === basename ||
        itemName === basenameWithoutExt ||
        itemPath === normalized ||
        itemPath.endsWith(`/${basename}`) ||
        itemPath.endsWith(`/${basenameWithoutExt}`)
      ) {
        return itemPath;
      }
    }

    for (const folderRef of listing.prefixes) {
      const match = await walk(folderRef.fullPath);
      if (match) return match;
    }

    return null;
  }

  return walk("");
}

export async function getFirebaseStorageUrl(
  url: string | undefined,
): Promise<string> {
  if (!url || typeof url !== "string") return "";

  let storagePath: string | null = null;

  // 1. Resolve Supabase public URL → extract the storage path
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const raw = url
      .split("supabase.co/storage/v1/object/public/")[1]
      ?.split("?")[0];
    if (raw) storagePath = decodeURIComponent(raw);
  }
  // 2. Resolve Firebase Storage URLs (e.g. https://firebasestorage.googleapis.com/.../o/path or https://...firebasestorage.app/...)
  else if (
    url.includes("firebasestorage.googleapis.com") ||
    url.includes(".firebasestorage.app") ||
    url.includes(".appspot.com")
  ) {
    const match = url.match(/\/o\/([^?#]+)/);
    if (match && match[1]) {
      storagePath = decodeURIComponent(match[1]);
    }
  }
  // 3. Resolve gs:// URLs (e.g. gs://bucket-name/docs/file.pdf)
  else if (url.startsWith("gs://")) {
    const withoutGs = url.substring(5);
    const firstSlash = withoutGs.indexOf("/");
    if (firstSlash !== -1) {
      storagePath = decodeURIComponent(withoutGs.substring(firstSlash + 1));
    } else {
      storagePath = decodeURIComponent(withoutGs);
    }
  }
  // 4. Resolve bare Firebase Storage paths (e.g. "page-covers/...", "book-covers/...", "icons/default-2d.png", "docs/...")
  else if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("file://") &&
    !url.startsWith("data:") &&
    !url.startsWith("blob:") &&
    !url.startsWith("/")
  ) {
    storagePath = url;
  }

  if (!storagePath) return url;

  // Normalize folder changes:
  if (storagePath.startsWith("Book Covers/")) {
    storagePath = "book-covers/" + storagePath.substring(12);
  } else if (storagePath.startsWith("Page Covers/")) {
    storagePath = "page-covers/" + storagePath.substring(12);
  } else if (storagePath.startsWith("Docs/")) {
    storagePath = "docs/" + storagePath.substring(5);
  } else if (storagePath.startsWith("Icons/")) {
    storagePath = "icons/" + storagePath.substring(6);
  }

  if (urlCache.has(storagePath)) {
    return urlCache.get(storagePath)!;
  }

  if (urlPromises.has(storagePath)) {
    return urlPromises.get(storagePath)!;
  }

  const promise = (async () => {
    try {
      const downloadUrl = await getDownloadURL(ref(storage, storagePath!));
      urlCache.set(storagePath!, downloadUrl);
      urlPromises.delete(storagePath!);
      return downloadUrl;
    } catch (err) {
      const discoveredPath = await findStoragePathByFileName(storagePath!);
      if (discoveredPath && discoveredPath !== storagePath) {
        const resolvedUrl = await getDownloadURL(ref(storage, discoveredPath));
        urlCache.set(storagePath!, resolvedUrl);
        urlCache.set(discoveredPath, resolvedUrl);
        urlPromises.delete(storagePath!);
        return resolvedUrl;
      }

      console.warn(
        "Failed to get Firebase Storage URL for path:",
        storagePath,
        err,
      );
      let fallbackUrl = url;
      if (
        (url.includes("firebasestorage.googleapis.com") ||
          url.includes(".firebasestorage.app") ||
          url.includes(".appspot.com")) &&
        storagePath
      ) {
        const bucket =
          storage.app.options.storageBucket ||
          "digilearn-af86d.firebasestorage.app";
        fallbackUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
      }
      urlCache.set(storagePath!, fallbackUrl);
      urlPromises.delete(storagePath!);
      return fallbackUrl;
    }
  })();

  urlPromises.set(storagePath, promise);
  return promise;
}

/**
 * React Hook to resolve a storage URL or bare path to a Firebase Storage download URL.
 */
export function useFirebaseStorageUrl(
  url: string | undefined,
): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (url) {
      getFirebaseStorageUrl(url).then((res) => {
        if (active) setResolvedUrl(res);
      });
    } else {
      setResolvedUrl(url);
    }
    return () => {
      active = false;
    };
  }, [url]);

  return resolvedUrl;
}
