import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export function AdminPublishHeader({
  title,
  onBack,
  disabled = false,
}: {
  title: string;
  onBack: () => void;
  disabled?: boolean;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={onBack}
        disabled={disabled}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
          },
          disabled && { backgroundColor: themeColors.lightBackground },
          pressed && styles.backButtonPressed,
        ]}
      >
        <Feather
          name="arrow-left"
          size={21}
          color={disabled ? themeColors.inactive : themeColors.text}
        />
      </Pressable>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7F0",
  },
  backButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.5,
  },
  backButtonPressed: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  copy: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
});
