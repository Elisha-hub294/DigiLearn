import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";

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
  createdAt: string;
  book: string;
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
  createdAt: "",
  book: "",
};

const FALLBACK_ICON_URL =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png";

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

  const updateField = (key: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddItem = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        title: formData.title.trim() || "Untitled",
        createdAt: serverTimestamp(),
      };

      if (formType === "book") {
        const parsedRating = Number.parseFloat(formData.rating.trim());
        await addDoc(collection(db, "books"), {
          ...payload,
          author: formData.author.trim() || "Added from app",
          subtitle:
            formData.subtitle.trim() ||
            "Freshly created from the library screen",
          image: formData.cover.trim() || FALLBACK_ICON_URL,
          avatar: FALLBACK_ICON_URL,
          rating: Number.isFinite(parsedRating) ? parsedRating : 4.8,
          isTop: formData.isTop,
        });
      } else if (formType === "banner") {
        await addDoc(collection(db, "promotionalBanner"), {
          ...payload,
          description:
            formData.subtitle.trim() ||
            "Added directly from the library screen",
          image: FALLBACK_ICON_URL,
          avatar: FALLBACK_ICON_URL,
        });
      } else if (formType === "page") {
        const trimmedCreatedAt = formData.createdAt.trim();
        const parsedCreatedAt = trimmedCreatedAt
          ? new Date(trimmedCreatedAt)
          : null;
        const bookList = formData.book
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        await addDoc(collection(db, "pages"), {
          title: formData.title.trim() || "Untitled note",
          subject: formData.subject.trim() || "General",
          description:
            formData.description.trim() ||
            "Added directly from the library screen",
          document: formData.document.trim() || "",
          preview: formData.document.trim() || "",
          book: bookList,
          createdAt: parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
            ? parsedCreatedAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "pastPaper"), {
          ...payload,
          subject: formData.subtitle.trim() || "General",
          type: formData.author.trim() || "UNEB",
          year: formData.extra.trim() || "2026",
          pages: formData.pages.trim() || "12 Pages",
          doc: formData.doc.trim() || "",
          image: FALLBACK_ICON_URL,
          document: formData.doc.trim() || "",
        });
      }

      setFormData(INITIAL_FORM_STATE);
      onClose();
      Alert.alert("Added", "The new item was saved to Firestore.");
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
          <Text style={styles.modalTitle}>
            {formType === "book"
              ? "Add a book"
              : formType === "banner"
                ? "Add a banner"
                : formType === "page"
                  ? "Add a page"
                  : "Add a past paper"}
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
              <Text style={styles.fieldLabel}>Created At</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.createdAt}
                onChangeText={(val) => updateField("createdAt", val)}
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
