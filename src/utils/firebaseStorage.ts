import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../../firebaseConfig";

// Cache to prevent duplicate getDownloadURL calls
const urlCache = new Map<string, string>();
const urlPromises = new Map<string, Promise<string>>();

/**
 * Resolves a Supabase storage URL to its equivalent Firebase Storage download URL.
 * If the URL is not a Supabase URL, it is returned as is.
 */
export async function getFirebaseStorageUrl(url: string | undefined): Promise<string> {
  if (!url || typeof url !== "string") return "";

  let storagePath: string | null = null;

  // Resolve Supabase public URL → extract the storage path
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const raw = url.split("supabase.co/storage/v1/object/public/")[1]?.split("?")[0];
    if (raw) storagePath = decodeURIComponent(raw);
  }
  // Resolve bare Firebase Storage paths (e.g. "TeacherProfile/tr-default.png", "icons/default-2d.png")
  else if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("file://") &&
    !url.startsWith("data:") &&
    !url.startsWith("/")
  ) {
    storagePath = url;
  }

  if (!storagePath) return url;

  // Normalize folder changes:
  // Book Covers > book-covers
  // Docs > docs
  // Icons > icons
  if (storagePath.startsWith("Book Covers/")) {
    storagePath = "book-covers/" + storagePath.substring(12);
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
      urlCache.set(storagePath!, url);
      urlPromises.delete(storagePath!);
      return url;
    });

  urlPromises.set(storagePath, promise);
  return promise;
}

/**
 * React Hook to resolve a potentially Supabase storage URL to a Firebase Storage URL.
 */
export function useFirebaseStorageUrl(url: string | undefined): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(url);

  useEffect(() => {
    let active = true;
    if (url && url.includes("supabase.co/storage/v1/object/public/")) {
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
