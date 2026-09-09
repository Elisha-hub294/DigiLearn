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

type FirebaseImageProps = ImageProps & {
  fallbackSource?: ImageProps["source"];
};

export function FirebaseImage({
  source,
  fallbackSource,
  onError,
  placeholder,
  ...props
}: FirebaseImageProps) {
  const rawString =
    typeof source === "string"
      ? source
      : typeof source === "object" && source && "uri" in source
        ? (source as any).uri
        : null;
  const sourceKey = rawString ?? JSON.stringify(source);
  const [resolvedState, setResolvedState] = useState<{
    key: string;
    source: any;
  }>({ key: sourceKey, source });
  const [failedSourceKey, setFailedSourceKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (rawString && needsResolution(rawString)) {
      getFirebaseStorageUrl(rawString).then((url) => {
        if (!active) return;
        const nextSource =
          typeof source === "string"
            ? url
            : { ...(source as object), uri: url };
        setResolvedState({ key: sourceKey, source: nextSource });
      });
    }

    return () => {
      active = false;
    };
  }, [rawString, source, sourceKey]);

  const resolvedSource =
    resolvedState.key === sourceKey ? resolvedState.source : source;
  const imageSource =
    failedSourceKey === sourceKey ? fallbackSource : resolvedSource;

  return (
    <Image
      source={imageSource}
      placeholder={placeholder ?? fallbackSource}
      onError={(event) => {
        setFailedSourceKey(sourceKey);
        onError?.(event);
      }}
      {...props}
    />
  );
}
