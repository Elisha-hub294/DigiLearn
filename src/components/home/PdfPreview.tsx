import { StyleSheet, View } from "react-native";
import Pdf from "react-native-pdf";

interface PdfPreviewProps {
  uri: string;
  style?: any;
}

export default function PdfPreview({ uri, style }: PdfPreviewProps) {
  const source = { uri, cache: true };

  return (
    <View
      pointerEvents="none"
      style={[style, { justifyContent: "flex-start" }]}
    >
      <Pdf
        source={source}
        page={1}
        scale={1}
        minScale={1}
        maxScale={1}
        enablePaging={false}
        fitPolicy={[0, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
