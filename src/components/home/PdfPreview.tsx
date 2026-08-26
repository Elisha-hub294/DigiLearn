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

export default function PdfPreview({
  uri,
  style,
  onLoad,
  onError,
  showLoadingIndicator = true,
}: PdfPreviewProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!PdfComponent || !uri || error) onError?.();
  }, [error, onError, uri]);

  if (!PdfComponent || error || !uri) {
    return <View style={[style, styles.fallback]} />;
  }

  const source = { uri, cache: true };

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
