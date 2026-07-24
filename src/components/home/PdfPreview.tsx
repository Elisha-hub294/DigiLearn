import React from "react";
import { View, StyleSheet } from "react-native";
import Pdf from "react-native-pdf";

interface PdfPreviewProps {
  uri: string;
  style: any;
}

export default function PdfPreview({ uri, style }: PdfPreviewProps) {
  return (
    <View pointerEvents="none" style={style}>
      <Pdf
        source={{ uri, cache: true }}
        style={StyleSheet.absoluteFill}
        singlePage={true}
        page={1}
        onError={(error) => console.log("PDF render error:", error)}
      />
    </View>
  );
}
