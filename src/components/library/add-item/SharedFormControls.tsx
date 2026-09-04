import { Feather as Icon } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../../../constants/theme";

export function InfoMessage({ children }: { children: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name="info" size={14} color="#2563EB" />
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

export function UploadProgressCard({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadHeader}>
        <View style={styles.uploadMeta}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.uploadLabel}>{label}</Text>
        </View>
        <Text style={styles.uploadPercent}>{safeProgress}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${safeProgress}%` }]} />
      </View>
    </View>
  );
}

export function UploadStatusModal({
  visible,
  title,
  message,
  progress,
}: {
  visible: boolean;
  title: string;
  message: string;
  progress: number;
}) {
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.uploadDialogBackdrop}>
        <View style={styles.uploadDialogCard}>
          <View style={styles.uploadDialogIconWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
          <Text style={styles.uploadDialogTitle}>{title}</Text>
          <Text style={styles.uploadDialogMessage}>{message}</Text>

          <View style={styles.uploadDialogBarWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${safeProgress}%` }]}
              />
            </View>
            <Text style={styles.uploadDialogPercent}>{safeProgress}%</Text>
          </View>
        </View>
      </View>
    </Modal>
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
  accessibilityLabel = "Notify Community",
}: {
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
}) {
  const [transition] = useState(() => new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    Animated.timing(transition, {
      toValue: checked ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [checked, transition]);

  return (
    <Pressable
      style={styles.toggleSwitch}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
    >
      <Animated.View
        style={[
          styles.toggleSwitchTrack,
          {
            backgroundColor: transition.interpolate({
              inputRange: [0, 1],
              outputRange: ["#DCE3ED", colors.primary],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.toggleCircle,
            {
              transform: [
                {
                  translateX: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 22],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
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
  uploadCard: {
    backgroundColor: "rgba(15, 118, 110, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.16)",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  uploadDialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  uploadDialogCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  uploadDialogIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    marginBottom: 14,
  },
  uploadDialogTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  uploadDialogMessage: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  uploadDialogBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadDialogPercent: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 40,
    textAlign: "right",
  },
  uploadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  uploadMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  uploadLabel: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  uploadPercent: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15, 118, 110, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#14B8A6",
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
  },
  toggleSwitchTrack: {
    flex: 1,
    borderRadius: 14,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
