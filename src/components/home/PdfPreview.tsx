import { Image } from "expo-image";
import { useState } from "react";
import { NativeModules, StyleSheet, UIManager, View } from "react-native";

interface PdfPreviewProps {
  uri: string;
  style?: any;
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

export default function PdfPreview({ uri, style }: PdfPreviewProps) {
  const [error, setError] = useState(false);

  if (!PdfComponent || error || !uri) {
    return (
      <Image
        source={require("../../../assets/images/pdf-preview.png")}
        style={style}
        contentFit="cover"
        contentPosition="top"
      />
    );
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
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
