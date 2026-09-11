import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export function PromptChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: themeColors.border, backgroundColor: themeColors.white },
      ]}
    >
      <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#B8B8B8",
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    color: "#808080",
    fontSize: 13,
    fontWeight: "600",
  },
});
