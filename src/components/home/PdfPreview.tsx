import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface PdfPreviewProps {
  uri: string;
  style?: any;
}

export default function PdfPreview({ uri, style }: PdfPreviewProps) {
  // Uses Google Docs Viewer to render the PDF preview in webview
  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    uri,
  )}`;

  return (
    <View pointerEvents="none" style={[style, { justifyContent: "flex-start" }]}>
      <WebView
        source={{ uri: googleDocsUrl }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
      />
    </View>
  );
}
