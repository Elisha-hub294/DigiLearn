import { Image, ImageProps } from "expo-image";
import { useEffect, useState } from "react";
import { getFirebaseStorageUrl } from "../../utils/firebaseStorage";

/** Returns true if the string is a bare Firebase Storage path (not a full https URL) */
function isStoragePath(value: string) {
  return (
    value.length > 0 &&
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("file://") &&
    !value.startsWith("data:") &&
    !value.startsWith("/")
  );
}

/** Returns true if the string needs to be resolved through Firebase Storage */
function needsResolution(value: string) {
  return (
    value.includes("supabase.co/storage/v1/object/public/") ||
    isStoragePath(value)
  );
}

export function FirebaseImage({ source, ...props }: ImageProps) {
  const [resolvedSource, setResolvedSource] = useState<any>(source);

  useEffect(() => {
    let active = true;

    const uri =
      typeof source === "object" && source && "uri" in source
        ? (source as any).uri
        : null;

    const rawString = typeof source === "string" ? source : uri;

    if (rawString && needsResolution(rawString)) {
      getFirebaseStorageUrl(rawString).then((url) => {
        if (!active) return;
        if (typeof source === "string") {
          setResolvedSource(url);
        } else {
          setResolvedSource({ ...(source as object), uri: url });
        }
      });
    } else {
      setResolvedSource(source);
    }

    return () => {
      active = false;
    };
  }, [source]);

  return <Image source={resolvedSource} {...props} />;
}
