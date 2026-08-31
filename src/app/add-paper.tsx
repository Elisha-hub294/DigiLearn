import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AddItemModal } from "../components/library/AddItemModal";
import { ActionDialog } from "../components/ui/ActionDialog";
import { colors } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

export default function AddPaperScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const isAuthorizedPublisher =
    profile?.type === "teacher" || profile?.type === "admin";

  return (
    <View style={styles.screen}>
      {isAuthorizedPublisher ? (
        <AddItemModal
          visible
          screen
          formType="paper"
          onClose={() => router.back()}
          onSuccess={() => router.replace("/")}
        />
      ) : (
        <ActionDialog
          visible
          title="Publishing restricted"
          message="Only teacher or admin accounts can publish past papers. Please switch to an approved account type to continue."
          primaryText="Go back"
          onPrimary={() => router.back()}
          onClose={() => router.back()}
          icon={<Text style={styles.dialogIcon}>⚠️</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  dialogIcon: {
    fontSize: 24,
  },
});
