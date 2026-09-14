import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface WatchAdModalProps {
  visible: boolean;
  resourceTitle?: string;
  onClose: () => void;
  onAdRewardEarned: () => void;
}

export function WatchAdModal({
  visible,
  resourceTitle,
  onClose,
  onAdRewardEarned,
}: WatchAdModalProps) {
  const { colors: themeColors } = useTheme();

  useEffect(() => {
    if (!visible) return;

    onAdRewardEarned();
    onClose();
  }, [onAdRewardEarned, onClose, visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.white,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>
            Preparing download
          </Text>
          {resourceTitle ? (
            <Text
              style={[styles.resourceTitle, { color: themeColors.subtitle }]}
              numberOfLines={2}
            >
              {resourceTitle}
            </Text>
          ) : null}
          <Text style={[styles.message, { color: themeColors.subtitle }]}>
            Downloads are available on the web without an advertisement.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue download"
            onPress={() => {
              onAdRewardEarned();
              onClose();
            }}
            style={[styles.button, { backgroundColor: themeColors.primary }]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  resourceTitle: {
    marginTop: 8,
    fontSize: 14,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: "center",
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
