import { SafeAreaView } from "react-native-safe-area-context";
import { PagePreviewScreen } from "../components/page/PagePreviewScreen";

export default function PagePreviewRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PagePreviewScreen />
    </SafeAreaView>
  );
}
