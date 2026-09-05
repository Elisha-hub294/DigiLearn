import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { NativeModules, StyleSheet, UIManager, View } from "react-native";

interface PdfPreviewProps {
  uri: string;
  style?: any;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingIndicator?: boolean;
}

let PdfComponent: any = null;

try {
  const hasNativeModule =
    !!NativeModules.RNPDFPdfViewManager ||
    !!UIManager.getViewManagerConfig?.("RNPDFPdfView");
  if (hasNativeModule) {
    PdfComponent = require("react-native-pdf").default;
  }
} catch (e) {
  PdfComponent = null;
}

import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";

export default function PdfPreview({
  uri,
  style,
  onLoad,
  onError,
  showLoadingIndicator = true,
}: PdfPreviewProps) {
  const { isDark } = useTheme();
  const [error, setError] = useState(false);
  const resolvedUri = useFirebaseStorageUrl(uri) || uri;

  useEffect(() => {
    setError(false);
  }, [resolvedUri]);

  const isValidUrl =
    typeof resolvedUri === "string" &&
    (resolvedUri.startsWith("http://") ||
      resolvedUri.startsWith("https://") ||
      resolvedUri.startsWith("file://") ||
      resolvedUri.startsWith("data:") ||
      resolvedUri.startsWith("blob:"));

  useEffect(() => {
    if (!PdfComponent || !isValidUrl || error) onError?.();
  }, [error, onError, isValidUrl]);

  if (!PdfComponent || error || !isValidUrl) {
    return (
      <Image
        source={getThemeAsset("pdfPreview", isDark)}
        style={[style, styles.fallback]}
        contentFit="cover"
      />
    );
  }

  const source = { uri: resolvedUri, cache: true };

  return (
    <View
      pointerEvents="none"
      style={[style, { justifyContent: "flex-start" }]}
    >
      <PdfComponent
        source={source}
        page={1}
        scale={1}
        minScale={1}
        maxScale={1}
        enablePaging={false}
        fitPolicy={[0, 1]}
        onError={(err: any) => {
          console.warn("PdfPreview render error:", err);
          setError(true);
          onError?.();
        }}
        onLoadComplete={onLoad}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#D1D5DB" },
});
