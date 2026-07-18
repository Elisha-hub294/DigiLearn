import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel = "Show all",
  onPress,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPress?: () => void;
}) => (
  <View style={styles.container}>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {onPress ? (
      <Pressable
        onPress={onPress}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  textWrap: { flex: 1, paddingRight: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: { color: colors.subtitle, fontSize: 13, marginTop: 2 },
  action: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
