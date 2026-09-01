import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { ActionDialog } from "../ui/ActionDialog";

export function PublishAccessGate({
  isAuthorizedPublisher,
  title,
  unauthorizedMessage,
  onBack,
  children,
}: {
  isAuthorizedPublisher: boolean;
  title: string;
  unauthorizedMessage: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  if (!isAuthorizedPublisher) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActionDialog
          visible
          title="Publishing restricted"
          message={unauthorizedMessage}
          primaryText="Go back"
          onPrimary={onBack}
          onClose={onBack}
          icon={<Text style={styles.dialogIcon}>⚠️</Text>}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dialogIcon: {
    fontSize: 24,
  },
});
