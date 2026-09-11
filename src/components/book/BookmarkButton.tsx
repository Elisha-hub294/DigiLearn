import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function BookmarkButton({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? "Remove bookmark" : "Bookmark book"}
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.surface }]}
    >
      <Ionicons
        name={selected ? "bookmark" : "bookmark-outline"}
        size={23}
        color={selected ? colors.success : colors.subtitle}
      />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F7F4",
  },
});
