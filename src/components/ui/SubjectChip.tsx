import { Pressable, StyleSheet, Text } from "react-native";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export type SubjectChipItem = {
  id: string;
  label: string;
  active?: boolean;
};

type SubjectChipProps = {
  item: SubjectChipItem;
  onPress?: () => void;
  variant?: "teacher" | "student";
};

export const SubjectChip = ({ item, onPress, variant }: SubjectChipProps) => {
  const { colors } = useTheme();
  const activeColor =
    variant === "teacher"
      ? colors.primaryRedDark
      : variant === "student"
        ? colors.primary
        : colors.dark;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: item.active ? activeColor : colors.surfaceMuted,
          borderColor: item.active ? activeColor : colors.surfaceBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: item.active ? colors.white : colors.text },
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
