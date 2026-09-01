import { Feather as Icon } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../../constants/theme";
import type { FormState } from "../AddItemModal";

type BookFormSectionProps = {
  formData: FormState;
  updateField: (key: keyof FormState, value: string | boolean) => void;
  subjects: { id: string; name: string }[];
  subjectDropdownOpen: boolean;
  setSubjectDropdownOpen: (
    value: boolean | ((prev: boolean) => boolean),
  ) => void;
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
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select book subject"
          style={styles.dropdownTrigger}
          onPress={() => setSubjectDropdownOpen((prev: boolean) => !prev)}
        >
          <Text style={styles.dropdownText}>
            {formData.subject || "Select subject"}
          </Text>
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
          accessibilityLabel="Choose book cover image"
          style={styles.attachmentButton}
          onPress={pickImage}
        >
          <Icon name="image" size={18} color={colors.primary} />
          <Text style={styles.attachmentButtonText} numberOfLines={1}>
            {selectedImage?.fileName || "Choose cover image"}
          </Text>
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
