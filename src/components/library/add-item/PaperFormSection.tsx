import { Feather as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import {
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../../constants/theme";
import PdfPreview from "../../home/PdfPreview";
import type { FormState } from "./constants";
import { DESCRIPTION_MAX_LENGTH, LEVEL_OPTIONS } from "./constants";
import { FilePickerField } from "./FilePickerField";
import { FieldLabel } from "./SharedFormControls";

interface PaperFormSectionProps {
  formData: {
    title: string;
    description: string;
    subject: string;
    author: string;
    level: string;
    extra: string;
  };
  updateField: (key: keyof FormState, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  pastPaperTypes: { id: string; name: string }[];
  subjectDropdownOpen: boolean;
  setSubjectDropdownOpen: (open: boolean) => void;
  typeDropdownOpen: boolean;
  setTypeDropdownOpen: (open: boolean) => void;
  levelDropdownOpen: boolean;
  setLevelDropdownOpen: (open: boolean) => void;
  showYearPicker: boolean;
  setShowYearPicker: (open: boolean) => void;
  currentYear: number;
  yearPickerDate: Date;
  selectedFile: DocumentPicker.DocumentPickerResult | null;
  selectedPreviewAsset: {
    type: "image" | "pdf";
    uri: string;
    name: string;
  } | null;
  pickDocument: () => void;
  clearSelectedFile: () => void;
  getWebDropHandlers: (type: "document" | "image") => any;
  sanitizeYearInput: (value: string) => string;
  isSubmitting: boolean;
  styles: any;
}

export function PaperFormSection({
  formData,
  updateField,
  subjects,
  pastPaperTypes,
  subjectDropdownOpen,
  setSubjectDropdownOpen,
  typeDropdownOpen,
  setTypeDropdownOpen,
  levelDropdownOpen,
  setLevelDropdownOpen,
  showYearPicker,
  setShowYearPicker,
  currentYear,
  yearPickerDate,
  selectedFile,
  selectedPreviewAsset,
  pickDocument,
  clearSelectedFile,
  getWebDropHandlers,
  sanitizeYearInput,
  isSubmitting,
  styles,
}: PaperFormSectionProps) {
  return (
    <>
      <FieldLabel>Title</FieldLabel>
      <TextInput
        style={styles.input}
        placeholder="Paper title"
        value={formData.title}
        onChangeText={(val) => updateField("title", val)}
        maxLength={100}
      />
      <Text style={styles.titleCharacterCount}>
        {formData.title.length}/100
      </Text>

      <FieldLabel>Description</FieldLabel>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Brief description of this paper"
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
          <FieldLabel>Type</FieldLabel>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select paper type"
              style={styles.dropdownTrigger}
              onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
            >
              <View style={styles.dropdownContent}>
                <Icon name="tag" size={16} color={colors.primary} />
                <Text style={styles.dropdownText}>
                  {formData.author || "Select type"}
                </Text>
              </View>
            </Pressable>
            {typeDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {pastPaperTypes.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateField("author", option.name);
                      setTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formData.author === option.name &&
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
        </View>

        <View style={styles.twoColumnField}>
          <FieldLabel>Level</FieldLabel>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select paper level"
              style={styles.dropdownTrigger}
              onPress={() => setLevelDropdownOpen(!levelDropdownOpen)}
            >
              <View style={styles.dropdownContent}>
                <Icon name="layers" size={16} color={colors.primary} />
                <Text style={styles.dropdownText}>
                  {formData.level || "Select level"}
                </Text>
              </View>
            </Pressable>
            {levelDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {LEVEL_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateField("level", option.value);
                      setLevelDropdownOpen(false);
                    }}
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
          <FieldLabel>Year</FieldLabel>
          {Platform.OS === "web" ? (
            <TextInput
              style={styles.input}
              placeholder="2026"
              value={formData.extra}
              onChangeText={(val) =>
                updateField("extra", sanitizeYearInput(val))
              }
              keyboardType="numeric"
              maxLength={4}
            />
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select paper year"
                style={styles.dropdownTrigger}
                onPress={() => setShowYearPicker(true)}
              >
                <View style={styles.dropdownContent}>
                  <Icon name="calendar" size={16} color={colors.primary} />
                  <Text style={styles.dropdownText}>
                    {formData.extra || "Select year"}
                  </Text>
                </View>
              </Pressable>
              {showYearPicker && (
                <DateTimePicker
                  value={yearPickerDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowYearPicker(false);
                    if (selectedDate) {
                      updateField("extra", String(selectedDate.getFullYear()));
                    }
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>

      <FieldLabel>Document file</FieldLabel>
      <FilePickerField
        label={
          selectedFile?.assets?.[0]
            ? "Change uploaded document"
            : "Upload a document"
        }
        value={selectedFile?.assets?.[0]?.name}
        hint={
          selectedFile?.assets?.[0]
            ? "Document ready to publish"
            : "Tap to select a document (max 5 MB)"
        }
        selected={Boolean(selectedFile?.assets?.[0])}
        onPress={pickDocument}
        disabled={isSubmitting}
        onDragHandlers={getWebDropHandlers("document")}
      />

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
