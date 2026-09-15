import { SafeAreaView } from "react-native-safe-area-context";
import PagesScreen from "../components/page/PagesScreen";

export default function PagesRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PagesScreen />
    </SafeAreaView>
  );
}
