import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { PrimaryButton } from "../PrimaryButton";

type NotificationEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export function NotificationEmptyState({
  title,
  description,
  actionLabel,
  onPressAction,
}: NotificationEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onPressAction ? (
        <PrimaryButton title={actionLabel} onPress={onPressAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.subtitle,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
