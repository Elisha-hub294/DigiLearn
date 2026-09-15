import { SafeAreaView } from "react-native-safe-area-context";
import { BookPreviewScreen } from "../components/book/BookPreviewScreen";

export default function BookPreviewRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <BookPreviewScreen />
    </SafeAreaView>
  );
}
