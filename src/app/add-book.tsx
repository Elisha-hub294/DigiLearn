import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AddItemModal } from "../components/library/AddItemModal";
import { colors } from "../constants/theme";

export default function AddBookScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <AddItemModal
        visible
        formType="book"
        onClose={() => router.back()}
        onSuccess={() => router.replace("/library")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
