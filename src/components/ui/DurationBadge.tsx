import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function DurationBadge({ duration }: { duration: string }) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? colors.surface : "rgba(0, 0, 0, 0.6)",
        },
      ]}
    >
      <Text
        style={[styles.text, { color: isDark ? colors.text : colors.white }]}
      >
        {duration}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
