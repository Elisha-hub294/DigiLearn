import * as DocumentPicker from "expo-document-picker";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
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
import { db, storage } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../../services/notifications";
import { AdminPublishHeader } from "./AdminPublishHeader";

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

const FALLBACK_ICON_URL = "icons/default-2d.png";

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
  screen?: boolean;
};

const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error("XHR failed", e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

export function AddItemModal({
  visible,
  formType,
  onClose,
  onSuccess,
  screen = false,
}: AddItemModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "subject"));
        const subjectList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name as string,
          }))
          .filter((item) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(subjectList);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    if (formType === "page" && visible) {
      fetchSubjects();
    }
  }, [formType, visible]);

  const updateField = (key: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const file = result.assets[0];
      // Enforce 5 MB max size
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "Please select a file smaller than 5 MB.",
        );
        return;
      }
      setSelectedFile(result);
    } catch (e) {
      console.error("Error picking document", e);
    }
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

        let documentUrl = formData.document.trim();
        let coverUrl = FALLBACK_ICON_URL;

        // If a file was selected, upload it to Firebase Storage
        if (
          selectedFile &&
          !selectedFile.canceled &&
          selectedFile.assets &&
          selectedFile.assets.length > 0
        ) {
          const file = selectedFile.assets[0];
          try {
            const blob = await uriToBlob(file.uri);
            const uniqueName = `${Date.now()}_${file.name || "document"}`;
            const storageRef = ref(storage, `docs/${uniqueName}`);
            await uploadBytes(storageRef, blob);
            documentUrl = await getDownloadURL(storageRef);
          } catch (e: any) {
            console.error("File upload failed", e);
            Alert.alert(
              "Upload Failed",
              `Unable to upload the selected file: ${e?.message || e}`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        await setDoc(doc(db, "pages", itemId), {
          book: bookList,
          cover: coverUrl,
          description: formData.description.trim() || "",
          document: documentUrl,
          level: formData.level || "Ordinary",
          subject: formData.subject.trim() || "General",
          title: formData.title.trim() || "Untitled note",
          updatedAt: serverTimestamp(),
          ...(formData.schoolClass.trim()
            ? { schoolClass: formData.schoolClass.trim() }
            : {}),
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
      setSelectedFile(null);
      onClose();
      Alert.alert("Added", "The new item was saved.");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to add library item", error);
      Alert.alert(
        "Error",
        `The item could not be added: ${error?.message || error}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const composerContent = (
    <View style={screen ? styles.screenContainer : styles.modalBackdrop}>
      <View style={screen ? styles.screenCard : styles.modalCard}>
        {screen && (
          <AdminPublishHeader
            onBack={onClose}
            title={
              formType === "book"
                ? "Add Book"
                : formType === "banner"
                  ? "Add an Announcement"
                  : formType === "page"
                    ? "Add Page"
                    : "Add Past Paper"
            }
          />
        )}
        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {!screen && (
            <Text style={styles.modalTitle}>
              {formType === "book"
                ? "Add Book"
                : formType === "banner"
                  ? "Post Announcement"
                  : formType === "page"
                    ? "Add page"
                    : "Add Past Paper"}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder={
              formType === "book"
                ? "Book title"
                : formType === "banner"
                  ? "Announcement title"
                  : "Page title"
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
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select subject"
                  style={styles.dropdownTrigger}
                  onPress={() => setSubjectDropdownOpen((prev) => !prev)}
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
              <Text style={styles.fieldLabel}>Document File</Text>
              <Pressable
                style={styles.filePicker}
                onPress={pickDocument}
                disabled={isSubmitting}
              >
                <Text style={styles.filePickerText}>
                  {selectedFile?.assets?.[0]
                    ? selectedFile.assets[0].name
                    : "Tap to select a file (max 5 MB)"}
                </Text>
              </Pressable>
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
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select subject"
                  style={styles.dropdownTrigger}
                  onPress={() => setSubjectDropdownOpen((prev) => !prev)}
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
  );

  if (screen) return composerContent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {composerContent}
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
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenCard: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  filePicker: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    justifyContent: "center",
  },
  filePickerText: {
    color: colors.text,
    fontSize: 14,
  },
  modalContent: {
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    marginBottom: spacing.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E6EBF2",
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
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#E9EEF5",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
});
