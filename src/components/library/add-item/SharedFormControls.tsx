import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../../constants/theme";

export function InfoMessage({ children }: { children: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name="info" size={14} color="#2563EB" />
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function CharacterCounter({
  current,
  maxLength,
}: {
  current: number;
  maxLength: number;
}) {
  return (
    <Text style={styles.titleCharacterCount}>
      {current}/{maxLength}
    </Text>
  );
}

export function NotifyToggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={[styles.toggleSwitch, checked && styles.toggleSwitchActive]}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel="Notify Community"
      accessibilityState={{ checked }}
    >
      <View
        style={[styles.toggleCircle, checked && styles.toggleCircleActive]}
      />
    </Pressable>
  );
}

export function ModalActionBar({
  onCancel,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
    <View style={styles.modalActions}>
      <Pressable
        style={styles.secondaryButton}
        onPress={onCancel}
        disabled={isSubmitting}
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={styles.primaryButton}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.primaryButtonText}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    color: "#1D4ED8",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  fieldLabel: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  titleCharacterCount: {
    alignSelf: "flex-end",
    color: colors.subtitle,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCE3ED",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleCircleActive: {
    backgroundColor: colors.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E6EBF2",
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#E9EEF5",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
});
