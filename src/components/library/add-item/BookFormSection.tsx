import { Feather as Icon } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../../constants/theme";
import { useTheme } from "../../../contexts/ThemeContext";
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
        placeholder="Book description"
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
        accessibilityLabel="Select book subject"
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
        <Text style={[styles.dropdownText, { color: themeColors.text }]}>
          {formData.subject || "Select subject"}
        </Text>
      </Pressable>

      <Text style={[styles.fieldLabel, { color: themeColors.subtitle }]}>
        Author
      </Text>
      <View
        style={[
          styles.readOnlyField,
          {
            backgroundColor: themeColors.lightBackground,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Image source={authorAvatarSource} style={styles.authorAvatar} />
        <Text style={[styles.readOnlyFieldText, { color: themeColors.text }]}>
          {authorName}
        </Text>
      </View>
      <Text style={[styles.fieldLabel, { color: themeColors.subtitle }]}>
        Cover
      </Text>
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
            {
              backgroundColor: themeColors.lightBackground,
              borderColor: themeColors.border,
            },
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
              <Text
                style={[
                  styles.attachmentButtonText,
                  { color: themeColors.text },
                ]}
                numberOfLines={1}
              >
                {selectedImage?.fileName || "Drag image here or tap to upload"}
              </Text>
              <Text
                style={[
                  styles.attachmentButtonHint,
                  { color: themeColors.subtitle },
                ]}
              >
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
          style={[
            styles.coverPreview,
            { backgroundColor: themeColors.lightBackground },
          ]}
        />
      )}
    </>
  );
}
