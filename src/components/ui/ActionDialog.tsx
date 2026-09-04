import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export type ActionDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  primaryText: string;
  secondaryText?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  icon?: ReactNode;
  primaryButtonColor?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;
};

export function ActionDialog({
  visible,
  title,
  message,
  primaryText,
  secondaryText,
  onPrimary,
  onSecondary,
  onClose,
  icon,
  primaryButtonColor,
  secondaryButtonColor,
  secondaryButtonTextColor,
}: ActionDialogProps) {
  const { colors } = useTheme();
  const resolvedPrimaryButtonColor = primaryButtonColor ?? colors.primary;
  const resolvedSecondaryButtonColor = secondaryButtonColor ?? colors.lightBackground;
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose ?? onSecondary ?? onPrimary}
    >
      <Pressable style={styles.backdrop} onPress={onClose ?? onSecondary}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
          accessibilityRole="alert"
        >
          {icon ? <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>{icon}</View> : null}
          <Text style={[styles.title, { color: colors.dark }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.subtitle }]}>{message}</Text>

          <View style={styles.actions}>
            {secondaryText && onSecondary ? (
              <Pressable
                onPress={() => {
                  onSecondary();
                  onClose?.();
                }}
                style={[
                  styles.button,
                  { backgroundColor: resolvedSecondaryButtonColor },
                ]}
              >
                <Text style={[styles.buttonText, { color: secondaryButtonTextColor ?? colors.dark }]}>
                  {secondaryText}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                onPrimary();
                onClose?.();
              }}
              style={[styles.button, { backgroundColor: resolvedPrimaryButtonColor }]}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {primaryText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  button: {
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
});
