import { Feather as Icon } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, shadows, spacing } from "../constants/theme";

export const SearchBar = () => {
  return (
    <View style={styles.container} accessibilityRole="search">
      <Icon name="search" size={18} color="#8A8A8A" />
      <TextInput
        accessibilityLabel="Search for lessons and resources"
        placeholder="Search"
        placeholderTextColor="#8A8A8A"
        style={styles.input}
        returnKeyType="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    ...shadows.soft,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
});
