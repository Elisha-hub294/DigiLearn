import { Feather as Icon } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing } from "../../../constants/theme";
import PdfPreview from "../../home/PdfPreview";
import { CLASS_OPTIONS, DESCRIPTION_MAX_LENGTH } from "./constants";
import { FieldLabel } from "./SharedFormControls";

interface PageFormSectionProps {
  formData: {
    title: string;
    description: string;
    subject: string;
    level: string;
    schoolClass: string;
  };
  updateField: (key: string, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  subjectDropdownOpen: boolean;
  setSubjectDropdownOpen: (open: boolean) => void;
  levelDropdownOpen: boolean;
  setLevelDropdownOpen: (open: boolean) => void;
  classDropdownOpen: boolean;
  setClassDropdownOpen: (open: boolean) => void;
  selectedFile: DocumentPicker.DocumentPickerResult | null;
  selectedPreviewAsset: {
    type: "image" | "pdf";
    uri: string;
    name: string;
  } | null;
  pickDocument: () => void;
  clearSelectedFile: () => void;
  getWebDropHandlers: (type: "document" | "image") => any;
  isSubmitting: boolean;
  styles: any;
}

export function PageFormSection({
  formData,
  updateField,
  subjects,
  subjectDropdownOpen,
  setSubjectDropdownOpen,
  levelDropdownOpen,
  setLevelDropdownOpen,
  classDropdownOpen,
  setClassDropdownOpen,
  selectedFile,
  selectedPreviewAsset,
  pickDocument,
  clearSelectedFile,
  getWebDropHandlers,
  isSubmitting,
  styles,
}: PageFormSectionProps) {
  const pageClassOptions = useMemo(
    () =>
      CLASS_OPTIONS[formData.level === "Advanced" ? "advanced" : "ordinary"],
    [formData.level],
  );

  const handleLevelSelect = (level: string) => {
    updateField("level", level);
    const nextClassOptions =
      level === "Advanced" ? CLASS_OPTIONS.advanced : CLASS_OPTIONS.ordinary;
    if (
      !nextClassOptions.some((option) => option.value === formData.schoolClass)
    ) {
      updateField("schoolClass", "");
    }
    setLevelDropdownOpen(false);
    setClassDropdownOpen(false);
  };

  return (
    <>
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Page description"
        value={formData.description}
        onChangeText={(val) => updateField("description", val)}
        multiline
        numberOfLines={4}
        maxLength={DESCRIPTION_MAX_LENGTH}
      />
      <Text style={styles.titleCharacterCount}>
        {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
      </Text>

      <FieldLabel>Subject</FieldLabel>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select subject"
          style={styles.dropdownTrigger}
          onPress={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
        >
          <View style={styles.dropdownContent}>
            <Icon name="book-open" size={16} color={colors.primary} />
            <Text style={styles.dropdownText}>
              {formData.subject || "Select subject"}
            </Text>
          </View>
        </Pressable>
        {subjectDropdownOpen && (
          <View style={styles.dropdownMenu}>
            {subjects.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("subject", option.name);
                  setSubjectDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    formData.subject === option.name &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {option.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.twoColumnRow}>
        <View style={styles.twoColumnField}>
          <FieldLabel>Level</FieldLabel>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select page level"
              style={styles.dropdownTrigger}
              onPress={() => setLevelDropdownOpen(!levelDropdownOpen)}
            >
              <View style={styles.dropdownContent}>
                <Icon name="layers" size={16} color={colors.primary} />
                <Text style={styles.dropdownText}>{formData.level}</Text>
              </View>
            </Pressable>
            {levelDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {[
                  { label: "Ordinary", value: "Ordinary" },
                  { label: "Advanced", value: "Advanced" },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    style={styles.dropdownItem}
                    onPress={() => handleLevelSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formData.level === option.value &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.twoColumnField}>
          <FieldLabel>Class</FieldLabel>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select class"
              style={styles.dropdownTrigger}
              onPress={() => setClassDropdownOpen(!classDropdownOpen)}
            >
              <View style={styles.dropdownContent}>
                <Icon name="users" size={16} color={colors.primary} />
                <Text style={styles.dropdownText}>
                  {formData.schoolClass || "Select class"}
                </Text>
              </View>
            </Pressable>
            {classDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {pageClassOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateField("schoolClass", option.value);
                      setClassDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formData.schoolClass === option.value &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <FieldLabel>Document File</FieldLabel>
      <View {...getWebDropHandlers("document")}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            selectedFile?.assets?.[0]
              ? "Change uploaded document"
              : "Upload a document"
          }
          style={({ pressed }) => [
            styles.filePicker,
            pressed && styles.filePickerPressed,
            selectedFile?.assets?.[0] && styles.filePickerSelected,
          ]}
          onPress={pickDocument}
          disabled={isSubmitting}
        >
          <View style={styles.filePickerContent}>
            <View style={styles.filePickerIcon}>
              <Icon name="file-text" size={18} color={colors.primary} />
            </View>
            <View style={styles.filePickerTextWrap}>
              <Text style={styles.filePickerText} numberOfLines={1}>
                {selectedFile?.assets?.[0]?.name ||
                  "Drag a file here or tap to upload"}
              </Text>
              <Text style={styles.filePickerHint}>
                {selectedFile?.assets?.[0]
                  ? "Document ready to publish"
                  : "PDF or DOCX • max 5 MB"}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {selectedPreviewAsset && (
        <View style={styles.previewContainer}>
          <View style={styles.coverPreviewFrame}>
            {selectedPreviewAsset.type === "image" ? (
              <Image
                source={{ uri: selectedPreviewAsset.uri }}
                style={styles.documentPreviewImage}
              />
            ) : (
              <PdfPreview
                uri={selectedPreviewAsset.uri}
                style={styles.documentPreviewPdf}
              />
            )}
            <View style={styles.previewOverlay} pointerEvents="none" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove selected file"
              style={styles.previewRemoveButton}
              onPress={clearSelectedFile}
            >
              <Icon name="x" size={14} color={colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    marginBottom: spacing.md,
  },
});
