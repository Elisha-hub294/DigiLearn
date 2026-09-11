import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export const REPORT_REASONS = [
  "Incorrect information",
  "Broken or unavailable",
  "Inappropriate content",
  "Duplicate resource",
  "Other",
] as const;

type ReportDialogProps = {
  visible: boolean;
  itemName: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (reasons: string[], details: string) => void;
  onClose: () => void;
};

export function ReportDialog({
  visible,
  itemName,
  submitting = false,
  error,
  onSubmit,
  onClose,
}: ReportDialogProps) {
  const { colors: themeColors } = useTheme();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelectedReasons([]);
      setDetails("");
    }
  }, [visible]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((value) => value !== reason)
        : [...current, reason],
    );
  };

  const canSubmit = selectedReasons.length > 0 || details.trim().length > 0;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: themeColors.white }]}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="flag-outline"
                size={21}
                color={themeColors.primary}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close report dialog"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={themeColors.inactive} />
            </Pressable>
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Report a problem
          </Text>
          <Text style={[styles.message, { color: themeColors.subtitle }]}>
            Help us improve "{itemName}". Choose any matches or describe the
            problem below.
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.chips}>
              {REPORT_REASONS.map((reason) => {
                const selected = selectedReasons.includes(reason);
                return (
                  <Pressable
                    key={reason}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleReason(reason)}
                    style={[
                      styles.chip,
                      { borderColor: themeColors.border },
                      selected && {
                        borderColor: themeColors.primary,
                        backgroundColor: themeColors.primaryLight,
                      },
                    ]}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={themeColors.primary}
                      />
                    ) : null}
                    <Text
                      style={[
                        [styles.chipText, { color: themeColors.text }],
                        selected && { color: themeColors.primary },
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              multiline
              maxLength={1000}
              value={details}
              onChangeText={setDetails}
              placeholder="Add more detail (optional)"
              placeholderTextColor={themeColors.subtitle}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
            />
            <Text style={[styles.counter, { color: themeColors.inactive }]}>
              {details.length}/1000
            </Text>
            {error ? (
              <Text style={[styles.error, { color: themeColors.danger }]}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={styles.cancelButton}
              disabled={submitting}
            >
              <Text
                style={[styles.cancelText, { color: themeColors.subtitle }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSubmit(selectedReasons, details.trim())}
              disabled={!canSubmit || submitting}
              style={[
                styles.submitButton,
                { backgroundColor: themeColors.primary },
                (!canSubmit || submitting) && styles.submitDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[styles.submitText, { color: themeColors.white }]}>
                  Send report
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.52)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    boxShadow: "0px 12px 20px rgba(15, 23, 42, 0.18)",
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  closeButton: { padding: 4 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 14 },
  message: {
    color: colors.subtitle,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  scrollContent: { paddingTop: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: colors.primary },
  input: {
    minHeight: 100,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 14,
  },
  counter: {
    color: colors.inactive,
    fontSize: 11,
    textAlign: "right",
    marginTop: 5,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  cancelButton: { paddingHorizontal: 15, paddingVertical: 12 },
  cancelText: { color: colors.subtitle, fontSize: 14, fontWeight: "700" },
  submitButton: {
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontSize: 14, fontWeight: "700" },
});
