import { SafeAreaView } from "react-native-safe-area-context";
import { PaperRevisionDashboard } from "../components/library/PaperRevisionDashboard";

export default function PaperRevisionDashboardRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PaperRevisionDashboard />
    </SafeAreaView>
  );
}
