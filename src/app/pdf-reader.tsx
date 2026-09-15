import { SafeAreaView } from "react-native-safe-area-context";
import { PdfReaderScreen } from "../components/page/PdfReaderScreen";

export default function PdfReaderRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PdfReaderScreen />
    </SafeAreaView>
  );
}
