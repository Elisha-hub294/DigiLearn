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
};

export const SubjectChip = ({ item, onPress }: SubjectChipProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: item.active ? colors.dark : colors.white,
          borderColor: item.active ? colors.dark : colors.border,
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
    paddingVertical: 10,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
