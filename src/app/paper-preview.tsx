import { SafeAreaView } from "react-native-safe-area-context";
import { PaperPreviewScreen } from "../components/library/PaperPreviewScreen";

export default function PaperPreviewRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PaperPreviewScreen />
    </SafeAreaView>
  );
}
