import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

type SearchEmptyStateProps = {
  title?: string;
  subtitle?: string;
};

export function SearchEmptyState({
  title = "No results found",
  subtitle = "Try another keyword, subject, author or teacher.",
}: SearchEmptyStateProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Icon name="inbox" size={38} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.subtitle }]}>
        {subtitle}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Home"
        onPress={() => router.push("/" as never)}
        style={[styles.homeBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.homeBtnText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 24,
  },
  homeBtn: {
    backgroundColor: "#006EFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
