import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../../firebaseConfig";

// Cache to prevent duplicate getDownloadURL calls
const urlCache = new Map<string, string>();
const urlPromises = new Map<string, Promise<string>>();

/**
 * Resolves a Supabase storage URL or bare storage path to its equivalent Firebase Storage download URL.
 * If the URL is not a Supabase URL or relative storage path, it is returned as is.
 */
export async function getFirebaseStorageUrl(url: string | undefined): Promise<string> {
  if (!url || typeof url !== "string") return "";

  let storagePath: string | null = null;

  // 1. Resolve Supabase public URL → extract the storage path
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const raw = url.split("supabase.co/storage/v1/object/public/")[1]?.split("?")[0];
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

  const promise = getDownloadURL(ref(storage, storagePath))
    .then((downloadUrl) => {
      urlCache.set(storagePath!, downloadUrl);
      urlPromises.delete(storagePath!);
      return downloadUrl;
    })
    .catch((err) => {
      console.warn("Failed to get Firebase Storage URL for path:", storagePath, err);
      // If resolving failed, fallback to properly encoded URL if it was a Firebase Storage URL with bad /o/ encoding
      let fallbackUrl = url;
      if (
        (url.includes("firebasestorage.googleapis.com") ||
          url.includes(".firebasestorage.app") ||
          url.includes(".appspot.com")) &&
        storagePath
      ) {
        const bucket = storage.app.options.storageBucket || "digilearn-af86d.firebasestorage.app";
        fallbackUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
      }
      urlCache.set(storagePath!, fallbackUrl);
      urlPromises.delete(storagePath!);
      return fallbackUrl;
    });

  urlPromises.set(storagePath, promise);
  return promise;
}

/**
 * React Hook to resolve a storage URL or bare path to a Firebase Storage download URL.
 */
export function useFirebaseStorageUrl(url: string | undefined): string | undefined {
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
