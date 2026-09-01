import { Feather as Icon } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../../constants/theme";
import PdfPreview from "../../home/PdfPreview";
import type { FormState } from "../AddItemModal";

type BannerFormSectionProps = {
  formData: FormState;
  updateField: (key: keyof FormState, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  subjectDropdownOpen: boolean;
  setSubjectDropdownOpen: (
    value: boolean | ((prev: boolean) => boolean),
  ) => void;
  selectedFile: any;
  selectedImage: any;
  selectedPreviewAsset: any;
  pickDocument: () => void;
  pickImage: () => void;
  clearSelectedFile: () => void;
  getWebDropHandlers: (type: "document" | "image") => any;
  isSubmitting: boolean;
  styles: any;
};

export function BannerFormSection({
  formData,
  updateField,
  subjects,
  subjectDropdownOpen,
  setSubjectDropdownOpen,
  selectedFile,
  selectedImage,
  selectedPreviewAsset,
  pickDocument,
  pickImage,
  clearSelectedFile,
  getWebDropHandlers,
  isSubmitting,
  styles,
}: BannerFormSectionProps) {
  return (
    <>
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Short description"
        value={formData.subtitle}
        onChangeText={(val) => updateField("subtitle", val)}
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text style={styles.titleCharacterCount}>
        {formData.subtitle.length}/500
      </Text>
      <Text style={styles.fieldLabel}>Subject</Text>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select subject"
          style={styles.dropdownTrigger}
          onPress={() => setSubjectDropdownOpen((prev: boolean) => !prev)}
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
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("subject", option.name);
                  setSubjectDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{option.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.fieldLabel}>Attachment</Text>
      <View style={styles.attachmentRow}>
        <View {...getWebDropHandlers("document")}>
          <Pressable
            style={styles.attachmentButton}
            onPress={pickDocument}
            disabled={isSubmitting}
          >
            <Icon name="file-text" size={18} color={colors.primary} />
            <Text style={styles.attachmentButtonText} numberOfLines={1}>
              {selectedFile?.assets?.[0]?.name || "Add document"}
            </Text>
          </Pressable>
        </View>
        <View {...getWebDropHandlers("image")}>
          <Pressable
            style={styles.attachmentButton}
            onPress={pickImage}
            disabled={isSubmitting}
          >
            <Icon name="image" size={18} color={colors.primary} />
            <Text style={styles.attachmentButtonText} numberOfLines={1}>
              {selectedImage?.fileName || "Add image"}
            </Text>
          </Pressable>
        </View>
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
