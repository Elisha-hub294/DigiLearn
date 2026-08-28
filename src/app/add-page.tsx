import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AddItemModal } from "../components/library/AddItemModal";
import { colors } from "../constants/theme";

export default function AddPageScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <AddItemModal
        visible
        screen
        formType="page"
        onClose={() => router.back()}
        onSuccess={() => router.replace("/library")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
