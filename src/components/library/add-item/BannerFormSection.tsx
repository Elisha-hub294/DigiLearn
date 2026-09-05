import { Feather as Icon } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../../constants/theme";
import { useTheme } from "../../../contexts/ThemeContext";
import PdfPreview from "../../home/PdfPreview";
import type { FormState } from "../AddItemModal";

type BannerFormSectionProps = {
  formData: FormState;
  updateField: (key: keyof FormState, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  subjectDropdownOpen?: boolean;
  setSubjectDropdownOpen?: (
    value: boolean | ((prev: boolean) => boolean),
  ) => void;
  onSelectSubject?: () => void;
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
  onSelectSubject,
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
  const { colors: themeColors } = useTheme();
  return (
    <>
      <Text style={[styles.fieldLabel, { color: themeColors.subtitle }]}>
        Description
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
            color: themeColors.text,
          },
        ]}
        placeholderTextColor={themeColors.subtitle}
        placeholder="Short description"
        value={formData.subtitle}
        onChangeText={(val) => updateField("subtitle", val)}
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text
        style={[styles.titleCharacterCount, { color: themeColors.subtitle }]}
      >
        {formData.subtitle.length}/500
      </Text>
      <Text style={[styles.fieldLabel, { color: themeColors.subtitle }]}>
        Subject
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select subject"
        style={[
          styles.dropdownTrigger,
          {
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
          },
        ]}
        onPress={() => {
          if (onSelectSubject) {
            onSelectSubject();
            return;
          }
          if (setSubjectDropdownOpen) {
            setSubjectDropdownOpen((prev: boolean) => !prev);
          }
        }}
      >
        <View style={styles.dropdownContent}>
          <Icon name="book-open" size={16} color={colors.primary} />
          <Text style={[styles.dropdownText, { color: themeColors.text }]}>
            {formData.subject || "Select subject"}
          </Text>
        </View>
      </Pressable>
      <Text style={[styles.fieldLabel, { color: themeColors.subtitle }]}>
        Attachment
      </Text>
      <View style={styles.attachmentRow}>
        <View {...getWebDropHandlers("document")}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectedFile?.assets?.[0]?.name
                ? "Change uploaded document"
                : "Upload a document"
            }
            style={({ pressed }) => [
              styles.attachmentButton,
              {
                backgroundColor: themeColors.lightBackground,
                borderColor: themeColors.border,
              },
              pressed && styles.attachmentButtonPressed,
              selectedFile?.assets?.[0] && styles.attachmentButtonSelected,
            ]}
            onPress={pickDocument}
            disabled={isSubmitting}
          >
            <View style={styles.attachmentButtonInner}>
              <View style={styles.attachmentButtonIcon}>
                <Icon name="file-text" size={18} color={colors.primary} />
              </View>
              <View style={styles.attachmentButtonTextWrap}>
                <Text
                  style={[
                    styles.attachmentButtonText,
                    { color: themeColors.text },
                  ]}
                  numberOfLines={1}
                >
                  {selectedFile?.assets?.[0]?.name ||
                    "Drag file here or tap to upload"}
                </Text>
                <Text
                  style={[
                    styles.attachmentButtonHint,
                    { color: themeColors.subtitle },
                  ]}
                >
                  {selectedFile?.assets?.[0]
                    ? "Document ready to publish"
                    : "PDF, DOCX, PPT, or PPTX • max 10 MB"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
        <View {...getWebDropHandlers("image")}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectedImage?.fileName
                ? "Change uploaded image"
                : "Upload an image"
            }
            style={({ pressed }) => [
              styles.attachmentButton,
              {
                backgroundColor: themeColors.lightBackground,
                borderColor: themeColors.border,
              },
              pressed && styles.attachmentButtonPressed,
              selectedImage && styles.attachmentButtonSelected,
            ]}
            onPress={pickImage}
            disabled={isSubmitting}
          >
            <View style={styles.attachmentButtonInner}>
              <View style={styles.attachmentButtonIcon}>
                <Icon name="image" size={18} color={colors.primary} />
              </View>
              <View style={styles.attachmentButtonTextWrap}>
                <Text
                  style={[
                    styles.attachmentButtonText,
                    { color: themeColors.text },
                  ]}
                  numberOfLines={1}
                >
                  {selectedImage?.fileName ||
                    "Drag image here or tap to upload"}
                </Text>
                <Text
                  style={[
                    styles.attachmentButtonHint,
                    { color: themeColors.subtitle },
                  ]}
                >
                  {selectedImage
                    ? "Image ready to publish"
                    : "JPG, JPEG, or PNG • max 10 MB"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
      {selectedPreviewAsset && (
        <View style={styles.previewContainer}>
          <View
            style={[
              styles.coverPreviewFrame,
              {
                backgroundColor: themeColors.white,
                borderColor: themeColors.border,
              },
            ]}
          >
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
