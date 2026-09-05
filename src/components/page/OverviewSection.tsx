import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function OverviewSection({ description }: { description?: string }) {
  const { colors } = useTheme();
  const text =
    description && description.trim()
      ? description
      : "No detailed overview available for this page.";

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Overview</Text>
      <Text style={[styles.description, { color: colors.subtitle }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  heading: {
    fontSize: 21,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
  },
});
