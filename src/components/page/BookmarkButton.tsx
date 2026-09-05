import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function BookmarkButton({
  selected,
  onPress,
  accentColor = "#000000",
}: {
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
}) {
  const { colors } = useTheme();
  const activeAccent = accentColor === "#000000" ? colors.primary : accentColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? "Remove bookmark" : "Bookmark note"}
      onPress={onPress}
      hitSlop={8}
    >
      <View
        style={[
          styles.button,
          selected
            ? [styles.selectedButton, { borderColor: `${activeAccent}44` }]
            : [
                styles.unselectedButton,
                {
                  backgroundColor: colors.lightBackground,
                  borderColor: colors.border,
                },
              ],
        ]}
      >
        <Ionicons
          name={selected ? "bookmark" : "bookmark-outline"}
          size={22}
          color={selected ? activeAccent : colors.inactive}
        />
      </View>
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
  },
  unselectedButton: {
    borderWidth: 1,
  },
  selectedButton: {
    borderWidth: 1,
  },
});
