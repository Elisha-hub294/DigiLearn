import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../../constants/theme";

type FilePickerFieldProps = {
  label?: string;
  value?: string;
  hint?: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  iconName?: keyof typeof Icon.glyphMap;
  onDragHandlers?: any;
  children?: React.ReactNode;
};

export function FilePickerField({
  label,
  value,
  hint,
  selected,
  onPress,
  disabled,
  iconName = "file-text",
  onDragHandlers,
  children,
}: FilePickerFieldProps) {
  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || "Upload file"}
      style={({ pressed }) => [
        styles.filePicker,
        pressed && styles.filePickerPressed,
        selected && styles.filePickerSelected,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.filePickerContent}>
        <View style={styles.filePickerIcon}>
          <Icon name={iconName} size={18} color={colors.primary} />
        </View>
        <View style={styles.filePickerTextWrap}>
          <Text style={styles.filePickerText} numberOfLines={1}>
            {value || "Drag a file here or tap to upload"}
          </Text>
          <Text style={styles.filePickerHint}>
            {hint || "PDF or DOCX • max 10 MB"}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (onDragHandlers) {
    return <View {...onDragHandlers}>{content}</View>;
  }

  return <>{children ?? content}</>;
}

const styles = StyleSheet.create({
  filePicker: {
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.24)",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    cursor: "pointer",
  },
  filePickerPressed: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.45)",
  },
  filePickerSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.38)",
  },
  filePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filePickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  filePickerTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  filePickerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  filePickerHint: {
    color: "#4B6AA6",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
