import { Feather as Icon } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
  selectedImages?: any[];
  selectedPreviewAsset: any;
  pickDocument: () => void;
  pickImage: () => void;
  clearSelectedFile: () => void;
  onRemoveImage?: (index: number) => void;
  onClearImages?: () => void;
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
  selectedImages = [],
  selectedPreviewAsset,
  pickDocument,
  pickImage,
  clearSelectedFile,
  onRemoveImage,
  onClearImages,
  getWebDropHandlers,
  isSubmitting,
  styles,
}: BannerFormSectionProps) {
  const { colors: themeColors } = useTheme();

  const images =
    selectedImages && selectedImages.length > 0
      ? selectedImages
      : selectedImage
        ? [selectedImage]
        : [];

  const hasImages = images.length > 0;
  const hasDocument = Boolean(selectedFile?.assets?.[0]);

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

      {/* Attachment Selection Row */}
      <View style={styles.attachmentRow}>
        {!hasImages && (
          <View {...getWebDropHandlers("document")} style={{ flex: 1 }}>
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
                    {selectedFile?.assets?.[0]?.name || "Upload document"}
                  </Text>
                  <Text
                    style={[
                      styles.attachmentButtonHint,
                      { color: themeColors.subtitle },
                    ]}
                  >
                    {selectedFile?.assets?.[0]
                      ? "Document ready to publish"
                      : "PDF, DOCX, PPT • max 10 MB"}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {!hasDocument && (
          <View {...getWebDropHandlers("image")} style={{ flex: 1 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload photos"
              style={({ pressed }) => [
                styles.attachmentButton,
                {
                  backgroundColor: themeColors.lightBackground,
                  borderColor: themeColors.border,
                },
                pressed && styles.attachmentButtonPressed,
                hasImages && styles.attachmentButtonSelected,
              ]}
              onPress={pickImage}
              disabled={isSubmitting || images.length >= 10}
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
                    {hasImages
                      ? `${images.length}/10 photos selected`
                      : "Upload photos"}
                  </Text>
                  <Text
                    style={[
                      styles.attachmentButtonHint,
                      { color: themeColors.subtitle },
                    ]}
                  >
                    {hasImages
                      ? images.length < 10
                        ? `Tap to add more (${10 - images.length} left)`
                        : "Maximum 10 photos reached"
                      : "Select up to 10 photos"}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Multi-Image Selected Preview Gallery */}
      {hasImages && (
        <View style={localStyles.imageGalleryContainer}>
          <View style={localStyles.galleryHeader}>
            <View style={localStyles.badgeRow}>
              <Icon name="image" size={15} color={colors.primary} />
              <Text
                style={[localStyles.galleryTitle, { color: themeColors.text }]}
              >
                Selected Photos ({images.length}/10)
              </Text>
            </View>
            {onClearImages && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear all photos"
                onPress={onClearImages}
                hitSlop={8}
              >
                <Text
                  style={[localStyles.clearAllText, { color: colors.primary }]}
                >
                  Clear all
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.thumbnailsScroll}
          >
            {images.map((img: any, idx: number) => {
              const uri = img.uri;
              return (
                <View
                  key={`${uri}-${idx}`}
                  style={[
                    localStyles.thumbnailCard,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.white,
                    },
                  ]}
                >
                  <Image source={{ uri }} style={localStyles.thumbnailImage} />
                  <View style={localStyles.imageIndexBadge}>
                    <Text style={localStyles.imageIndexText}>{idx + 1}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${idx + 1}`}
                    style={localStyles.removeBadge}
                    onPress={() => onRemoveImage?.(idx)}
                  >
                    <Icon name="x" size={12} color={colors.white} />
                  </Pressable>
                </View>
              );
            })}

            {images.length < 10 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add more photos"
                style={[
                  localStyles.addMoreCard,
                  {
                    borderColor: colors.primary,
                    backgroundColor: themeColors.lightBackground,
                  },
                ]}
                onPress={pickImage}
                disabled={isSubmitting}
              >
                <View
                  style={[
                    localStyles.addMoreIconWrap,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Icon name="plus" size={20} color={colors.primary} />
                </View>
                <Text
                  style={[localStyles.addMoreText, { color: colors.primary }]}
                >
                  Add Photo
                </Text>
                <Text
                  style={[
                    localStyles.addMoreSubtext,
                    { color: themeColors.subtitle },
                  ]}
                >
                  {10 - images.length} left
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}

      {/* Document preview (if document selected) */}
      {!hasImages && selectedPreviewAsset && (
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
            <View style={[styles.previewOverlay, { pointerEvents: "none" }]} />
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

const localStyles = StyleSheet.create({
  imageGalleryContainer: {
    marginTop: 14,
    marginBottom: 4,
  },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  galleryTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  thumbnailsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  thumbnailCard: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageIndexBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageIndexText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    boxShadow: "0px 1px 3px rgba(0,0,0,0.2)",
  },
  addMoreCard: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  addMoreIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addMoreSubtext: {
    fontSize: 9,
    marginTop: 1,
  },
});
