import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import {
    appendNotificationToAllUsers,
    buildLibraryNotification,
} from "../../services/notifications";

export type FormType = "book" | "banner" | "paper" | "page";

type FormState = {
  title: string;
  subtitle: string;
  author: string;
  extra: string;
  cover: string;
  rating: string;
  isTop: boolean;
  pages: string;
  doc: string;
  subject: string;
  description: string;
  document: string;
  book: string;
  level: string;
  schoolClass: string;
};

const INITIAL_FORM_STATE: FormState = {
  title: "",
  subtitle: "",
  author: "",
  extra: "",
  cover: "",
  rating: "",
  isTop: false,
  pages: "",
  doc: "",
  subject: "",
  description: "",
  document: "",
  book: "",
  level: "Ordinary",
  schoolClass: "",
};

const FALLBACK_ICON_URL =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png";

const getTitleDocId = (title: string) => {
  const sanitized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || `untitled-${Date.now()}`;
};

type AddItemModalProps = {
  visible: boolean;
  formType: FormType;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddItemModal({
  visible,
  formType,
  onClose,
  onSuccess,
}: AddItemModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const updateField = (key: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pageClassOptions =
    formData.level === "Advanced"
      ? [
          { label: "Senior 5", value: "Senior 5" },
          { label: "Senior 6", value: "Senior 6" },
        ]
      : [
          { label: "Senior 1", value: "Senior 1" },
          { label: "Senior 2", value: "Senior 2" },
          { label: "Senior 3", value: "Senior 3" },
          { label: "Senior 4", value: "Senior 4" },
        ];

  const handleLevelSelect = (level: string) => {
    const nextClassOptions =
      level === "Advanced"
        ? [
            { label: "Senior 5", value: "Senior 5" },
            { label: "Senior 6", value: "Senior 6" },
          ]
        : [
            { label: "Senior 1", value: "Senior 1" },
            { label: "Senior 2", value: "Senior 2" },
            { label: "Senior 3", value: "Senior 3" },
            { label: "Senior 4", value: "Senior 4" },
          ];

    updateField("level", level);
    if (
      !nextClassOptions.some((option) => option.value === formData.schoolClass)
    ) {
      updateField("schoolClass", "");
    }
    setLevelDropdownOpen(false);
    setClassDropdownOpen(false);
  };

  const handleAddItem = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        title: formData.title.trim() || "Untitled",
      };

      let createdItemId = "";
      let notificationType: "book" | "page" | "lesson" | "announcement" =
        "book";

      if (formType === "book") {
        const parsedRating = Number.parseFloat(formData.rating.trim());
        const itemId = getTitleDocId(formData.title);
        createdItemId = itemId;
        notificationType = "book";
        await setDoc(doc(db, "books", itemId), {
          ...payload,
          author: formData.author.trim() || "Added from app",
          subtitle:
            formData.subtitle.trim() ||
            "Freshly created from the library screen",
          image: formData.cover.trim() || FALLBACK_ICON_URL,
          avatar: FALLBACK_ICON_URL,
          rating: Number.isFinite(parsedRating) ? parsedRating : 4.8,
          isTop: formData.isTop,
          updatedAt: serverTimestamp(),
        });
      } else if (formType === "banner") {
        await setDoc(
          doc(db, "promotionalBanner", getTitleDocId(formData.title)),
          {
            ...payload,
            description: formData.subtitle.trim() || "",
            image: FALLBACK_ICON_URL,
            avatar: FALLBACK_ICON_URL,
            updatedAt: serverTimestamp(),
          },
        );
      } else if (formType === "page") {
        const bookList = formData.book
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const itemId = getTitleDocId(formData.title);
        createdItemId = itemId;
        notificationType = "page";

        await setDoc(doc(db, "pages", itemId), {
          title: formData.title.trim() || "Untitled note",
          subject: formData.subject.trim() || "General",
          description: formData.description.trim() || "",
          document: formData.document.trim() || "",
          book: bookList,
          level: formData.level || "Ordinary",
          schoolClass: formData.schoolClass.trim() || "",
          updatedAt: serverTimestamp(),
        });
      } else {
        const itemId = getTitleDocId(formData.title);
        createdItemId = itemId;
        notificationType = "lesson";
        await setDoc(doc(db, "pastPaper", itemId), {
          ...payload,
          subject: formData.subtitle.trim() || "General",
          type: formData.author.trim() || "UNEB",
          year: formData.extra.trim() || "2026",
          pages: formData.pages.trim() || "12 Pages",
          doc: formData.doc.trim() || "",
          image: FALLBACK_ICON_URL,
          document: formData.doc.trim() || "",
          updatedAt: serverTimestamp(),
        });
      }

      if (createdItemId) {
        await appendNotificationToAllUsers(
          buildLibraryNotification(notificationType, createdItemId),
        );
      }

      setFormData(INITIAL_FORM_STATE);
      onClose();
      Alert.alert("Added", "The new item was saved.");
      onSuccess();
    } catch (error) {
      console.error("Failed to add library item", error);
      Alert.alert("Error", "The item could not be added. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>
              {formType === "book"
                ? "(ADMIN) Add a book"
                : formType === "banner"
                  ? "(ADMIN) Add a banner"
                  : formType === "page"
                    ? "(ADMIN) Add a page"
                    : "(ADMIN) Add a past paper"}
            </Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder={
                formType === "book"
                  ? "Book title"
                  : formType === "banner"
                    ? "Banner title"
                    : "Paper title"
              }
              value={formData.title}
              onChangeText={(val) => updateField("title", val)}
            />

            {formType === "book" && (
              <>
                <Text style={styles.fieldLabel}>Author</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Author"
                  value={formData.author}
                  onChangeText={(val) => updateField("author", val)}
                />
                <Text style={styles.fieldLabel}>Subtitle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Short description"
                  value={formData.subtitle}
                  onChangeText={(val) => updateField("subtitle", val)}
                />
                <Text style={styles.fieldLabel}>Cover</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL"
                  value={formData.cover}
                  onChangeText={(val) => updateField("cover", val)}
                />
                <Text style={styles.fieldLabel}>Rating</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4.8"
                  value={formData.rating}
                  onChangeText={(val) => updateField("rating", val)}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>Featured</Text>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      formData.isTop && styles.toggleChipActive,
                    ]}
                    onPress={() => updateField("isTop", true)}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        formData.isTop && styles.toggleChipTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      !formData.isTop && styles.toggleChipActive,
                    ]}
                    onPress={() => updateField("isTop", false)}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        !formData.isTop && styles.toggleChipTextActive,
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {formType === "banner" && (
              <>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Short description"
                  value={formData.subtitle}
                  onChangeText={(val) => updateField("subtitle", val)}
                />
              </>
            )}

            {formType === "page" && (
              <>
                <Text style={styles.fieldLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Subject"
                  value={formData.subject}
                  onChangeText={(val) => updateField("subject", val)}
                />
                <Text style={styles.fieldLabel}>Level</Text>
                <View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select page level"
                    style={styles.dropdownTrigger}
                    onPress={() => setLevelDropdownOpen((prev) => !prev)}
                  >
                    <Text style={styles.dropdownText}>{formData.level}</Text>
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
                <Text style={styles.fieldLabel}>Class</Text>
                <View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select class"
                    style={styles.dropdownTrigger}
                    onPress={() => setClassDropdownOpen((prev) => !prev)}
                  >
                    <Text style={styles.dropdownText}>
                      {formData.schoolClass || "Select class"}
                    </Text>
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
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Page description"
                  value={formData.description}
                  onChangeText={(val) => updateField("description", val)}
                  multiline
                  numberOfLines={4}
                />
                <Text style={styles.fieldLabel}>Document URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/document.pdf"
                  value={formData.document}
                  onChangeText={(val) => updateField("document", val)}
                />
                <Text style={styles.fieldLabel}>Book</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Book A, Book B, Book C"
                  value={formData.book}
                  onChangeText={(val) => updateField("book", val)}
                />
              </>
            )}

            {formType === "paper" && (
              <>
                <Text style={styles.fieldLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Subject"
                  value={formData.subtitle}
                  onChangeText={(val) => updateField("subtitle", val)}
                />
                <Text style={styles.fieldLabel}>Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="UNEB / MOCK"
                  value={formData.author}
                  onChangeText={(val) => updateField("author", val)}
                />
                <Text style={styles.fieldLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026"
                  value={formData.extra}
                  onChangeText={(val) => updateField("extra", val)}
                />
                <Text style={styles.fieldLabel}>Pages</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  value={formData.pages}
                  onChangeText={(val) => updateField("pages", val)}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>Doc</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Document URL"
                  value={formData.doc}
                  onChangeText={(val) => updateField("doc", val)}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={handleAddItem}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalContent: {
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  toggleChip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 14,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 14,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  toggleChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  toggleChipText: {
    color: colors.subtitle,
    fontWeight: "700",
  },
  toggleChipTextActive: {
    color: colors.primary,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
});
