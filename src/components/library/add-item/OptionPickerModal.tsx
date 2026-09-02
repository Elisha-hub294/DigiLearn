import { Feather as Icon } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../constants/theme";

export type PickerOption = {
  label: string;
  value: string;
};

type OptionPickerModalProps = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedValue?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function OptionPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: OptionPickerModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.optionPickerBackdrop} onPress={onClose}>
        <Pressable
          style={styles.optionPickerCard}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.optionPickerTitle}>{title}</Text>
          <View style={styles.optionPickerList}>
            {options.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  style={[
                    styles.optionPickerItem,
                    isSelected && styles.optionPickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionPickerItemText,
                      isSelected && styles.optionPickerItemTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon name="check" size={16} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  optionPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  optionPickerCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  optionPickerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionPickerList: {
    gap: 8,
  },
  optionPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionPickerItemSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  optionPickerItemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  optionPickerItemTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});
