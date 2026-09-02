import { Feather as Icon } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../../constants/theme";
import type { FormState } from "../AddItemModal";

type BookFormSectionProps = {
  formData: FormState;
  updateField: (key: keyof FormState, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  subjectDropdownOpen?: boolean;
  setSubjectDropdownOpen?: (
    value: boolean | ((prev: boolean) => boolean),
  ) => void;
  onSelectSubject?: () => void;
  selectedImage: any;
  pickImage: () => void;
  authorName: string;
  authorAvatarSource: any;
  getWebDropHandlers: (type: "document" | "image") => any;
  styles: any;
};

export function BookFormSection({
  formData,
  updateField,
  subjects,
  subjectDropdownOpen,
  setSubjectDropdownOpen,
  onSelectSubject,
  selectedImage,
  pickImage,
  authorName,
  authorAvatarSource,
  getWebDropHandlers,
  styles,
}: BookFormSectionProps) {
  return (
    <>
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Book description"
        value={formData.subtitle}
        onChangeText={(val) => updateField("subtitle", val)}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <Text style={styles.fieldLabel}>Subject</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select book subject"
        style={styles.dropdownTrigger}
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
        <Text style={styles.dropdownText}>
          {formData.subject || "Select subject"}
        </Text>
      </Pressable>

      <Text style={styles.titleCharacterCount}>
        {formData.subtitle.length}/500
      </Text>
      <Text style={styles.fieldLabel}>Author</Text>
      <View style={styles.readOnlyField}>
        <Image source={authorAvatarSource} style={styles.authorAvatar} />
        <Text style={styles.readOnlyFieldText}>{authorName}</Text>
      </View>
      <Text style={styles.fieldLabel}>Cover</Text>
      <View {...getWebDropHandlers("image")}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            selectedImage?.fileName
              ? "Change book cover image"
              : "Choose book cover image"
          }
          style={({ pressed }) => [
            styles.attachmentButton,
            pressed && styles.attachmentButtonPressed,
            selectedImage && styles.attachmentButtonSelected,
          ]}
          onPress={pickImage}
        >
          <View style={styles.attachmentButtonInner}>
            <View style={styles.attachmentButtonIcon}>
              <Icon name="image" size={18} color={colors.primary} />
            </View>
            <View style={styles.attachmentButtonTextWrap}>
              <Text style={styles.attachmentButtonText} numberOfLines={1}>
                {selectedImage?.fileName || "Drag image here or tap to upload"}
              </Text>
              <Text style={styles.attachmentButtonHint}>
                {selectedImage
                  ? "Cover image ready to publish"
                  : "JPG, JPEG, or PNG • max 10 MB"}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
      {selectedImage && (
        <Image
          source={{ uri: selectedImage.uri }}
          style={styles.coverPreview}
        />
      )}
    </>
  );
}
