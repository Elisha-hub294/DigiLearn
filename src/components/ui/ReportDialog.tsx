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
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="flag-outline" size={21} color={colors.primary} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close report dialog"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>
          <Text style={styles.title}>Report a problem</Text>
          <Text style={styles.message}>
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
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primary}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
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
              placeholderTextColor="#94A3B8"
              textAlignVertical="top"
              style={styles.input}
            />
            <Text style={styles.counter}>{details.length}/1000</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={styles.cancelButton}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSubmit(selectedReasons, details.trim())}
              disabled={!canSubmit || submitting}
              style={[
                styles.submitButton,
                (!canSubmit || submitting) && styles.submitDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitText}>Send report</Text>
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
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
    backgroundColor: "#EAF2FF",
  },
  closeButton: { padding: 4 },
  title: { color: "#0F172A", fontSize: 22, fontWeight: "700", marginTop: 14 },
  message: { color: "#475569", fontSize: 14, lineHeight: 21, marginTop: 7 },
  scrollContent: { paddingTop: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: "#EAF2FF" },
  chipText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: colors.primary },
  input: {
    minHeight: 100,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    color: "#0F172A",
    fontSize: 14,
  },
  counter: { color: "#94A3B8", fontSize: 11, textAlign: "right", marginTop: 5 },
  error: { color: "#B42318", fontSize: 12, marginTop: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  cancelButton: { paddingHorizontal: 15, paddingVertical: 12 },
  cancelText: { color: "#475569", fontSize: 14, fontWeight: "700" },
  submitButton: {
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
