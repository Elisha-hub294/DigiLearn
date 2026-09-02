import { Feather as Icon } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { auth } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { ActionDialog } from "../ui/ActionDialog";
import { AdminPublishHeader } from "./AdminPublishHeader";
import { BannerFormSection } from "./add-item/BannerFormSection";
import { BookFormSection } from "./add-item/BookFormSection";
import {
  OptionPickerModal,
  type PickerOption,
} from "./add-item/OptionPickerModal";
import { PageFormSection } from "./add-item/PageFormSection";
import { PaperFormSection } from "./add-item/PaperFormSection";
import {
  CharacterCounter,
  FieldLabel,
  InfoMessage,
  ModalActionBar,
  NotifyToggle,
  UploadStatusModal,
} from "./add-item/SharedFormControls";
import type { FormState, FormType } from "./add-item/constants";
import {
  FALLBACK_ICON_URL,
  INITIAL_FORM_STATE,
  TITLE_MAX_LENGTH,
} from "./add-item/constants";
import { getFileValidationError } from "./add-item/fileValidation";
import {
  addBanner,
  addBook,
  addPage,
  addPastPaper,
  notifyUsersAboutNewItem,
  uploadAssetToStorage,
} from "./add-item/firebaseService";
import {
  useDropdowns,
  useFormOptions,
  useFormState,
  useInfoMessage,
  usePdfProcessing,
  useStatusDialog,
  useUploadProgress,
  useYearPicker,
} from "./add-item/hooks";
import {
  generatePdfFirstPageThumbnail,
  getPdfPageCount,
  getWebViewHtml,
} from "./add-item/pdfService";
import {
  cleanFileNameForTitle,
  getTitleDocId,
  normalizeText,
  resolveUploadError,
  sanitizeFileName,
  uriToBlob,
} from "./add-item/utils";
export type { FormState, FormType };

const DEFAULT_USER_AVATAR = require("../../../assets/images/user-default.png");

type PickerConfig = {
  title: string;
  options: PickerOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
};

type AddItemModalProps = {
  visible: boolean;
  formType: FormType;
  onClose: () => void;
  onSuccess: () => void;
  screen?: boolean;
};

export function AddItemModal({
  visible,
  formType,
  onClose,
  onSuccess,
  screen = false,
}: AddItemModalProps) {
  const { profile } = useProfile();
  const webViewRef = useRef<any>(null);

  // Use custom hooks for state management
  const { formData, updateField, setFormData } = useFormState();
  const { uploadProgress, setUploadProgress, resetProgress } =
    useUploadProgress();
  const { subjects, pastPaperTypes } = useFormOptions(formType, visible);
  const {
    levelDropdownOpen,
    setLevelDropdownOpen,
    classDropdownOpen,
    setClassDropdownOpen,
    subjectDropdownOpen,
    setSubjectDropdownOpen,
    typeDropdownOpen,
    setTypeDropdownOpen,
  } = useDropdowns();
  const { statusDialog, setStatusDialog, showStatusDialog } = useStatusDialog();
  const { infoMessage, setInfoMessage } = useInfoMessage();
  const { showYearPicker, setShowYearPicker, currentYear, getYearPickerDate } =
    useYearPicker();
  const { pdfToProcess, setPdfToProcess } = usePdfProcessing();

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [activeWebDropType, setActiveWebDropType] = useState<
    "document" | "image" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<PickerConfig | null>(null);

  const isAuthorizedPublisher =
    profile?.type === "teacher" || profile?.type === "admin";

  const closeOptionPicker = () => setPickerConfig(null);

  const openOptionPicker = (
    title: string,
    options: PickerOption[],
    selectedValue: string | undefined,
    onSelect: (value: string) => void,
  ) => {
    setSubjectDropdownOpen(false);
    setLevelDropdownOpen(false);
    setClassDropdownOpen(false);
    setTypeDropdownOpen(false);
    setShowYearPicker(false);
    setPickerConfig({ title, options, selectedValue, onSelect });
  };

  const handleClose = () => {
    setPdfToProcess(null);
    resetProgress();
    setStatusDialog(null);
    setPickerConfig(null);
    onClose();
  };

  const uploadProgressRef = useRef({ document: 0, preview: 0 });

  const updateUploadProgress = (label: string, progress: number) => {
    updateCombinedUploadProgress("document", progress, label);
  };

  const updateCombinedUploadProgress = (
    stage: "document" | "preview",
    progress: number,
    label: string,
  ) => {
    const nextState = {
      ...uploadProgressRef.current,
      [stage]: Math.max(0, Math.min(progress, 100)),
    };

    uploadProgressRef.current = nextState;

    const combinedProgress = Math.round(
      nextState.document * 0.8 + nextState.preview * 0.2,
    );

    setUploadProgress({
      active: true,
      label,
      progress: combinedProgress,
    });
  };

  const silentUploadProgress = (label: string, progress: number) => {
    updateCombinedUploadProgress("preview", progress, label);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedImage(null);
    updateField("title", "");
  };

  const setTitleFromSelectedFile = (fileName: string) => {
    const cleanFileName = cleanFileNameForTitle(fileName);
    if (!cleanFileName || formData.title.trim()) return;
    updateField("title", cleanFileName);
  };

  const applyWebDroppedFile = useCallback(
    (file: File, type: "document" | "image") => {
      if (type === "image") {
        const fileName = file.name || "";
        const mimeType = file.type || "";

        const error = getFileValidationError(fileName, file.size, true);
        if (error) {
          Alert.alert("Invalid Image", error);
          return;
        }

        setSelectedImage({
          uri: URL.createObjectURL(file),
          fileName,
          mimeType,
          fileSize: file.size,
          width: 0,
          height: 0,
        } as ImagePicker.ImagePickerAsset);
        setSelectedFile(null);
        return;
      }

      const fileName = file.name || "";
      const mimeType = file.type || "";

      const error = getFileValidationError(fileName, file.size, false);
      if (error) {
        Alert.alert("Invalid File", error);
        return;
      }

      setSelectedFile({
        canceled: false,
        assets: [
          {
            uri: URL.createObjectURL(file),
            name: fileName,
            mimeType,
            size: file.size,
          },
        ],
      } as DocumentPicker.DocumentPickerResult);
      setSelectedImage(null);
      setTitleFromSelectedFile(fileName);
    },
    [setTitleFromSelectedFile],
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const preventDefault = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleGlobalDragDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        event.preventDefault();
        event.stopPropagation();
        const targetType = activeWebDropType ?? "document";
        applyWebDroppedFile(file, targetType);
        setActiveWebDropType(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", handleGlobalDragDrop, false);

    return () => {
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", handleGlobalDragDrop, false);
    };
  }, [activeWebDropType, applyWebDroppedFile]);

  const handleWebDragEnter = (event: any, type: "document" | "image") => {
    if (Platform.OS !== "web") return;
    event.preventDefault?.();
    event.stopPropagation?.();
    setActiveWebDropType(type);
  };

  const handleWebDragOver = (event: any, type: "document" | "image") => {
    if (Platform.OS !== "web") return;
    event.preventDefault?.();
    event.stopPropagation?.();
    setActiveWebDropType(type);
    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleWebDragLeave = (event: any) => {
    if (Platform.OS !== "web") return;
    event.preventDefault?.();
    event.stopPropagation?.();
  };

  const getWebDropHandlers = (type: "document" | "image") =>
    ({
      onDragEnter: (event: any) => handleWebDragEnter(event, type),
      onDragOver: (event: any) => handleWebDragOver(event, type),
      onDragLeave: handleWebDragLeave,
      onDrop: (event: any) => handleWebDrop(event, type),
    }) as any;

  const handleWebDrop = (event: any, type: "document" | "image") => {
    if (Platform.OS !== "web") return;
    event.preventDefault?.();
    event.stopPropagation?.();
    const file =
      event?.nativeEvent?.dataTransfer?.files?.[0] ??
      event?.dataTransfer?.files?.[0];
    if (!file) return;
    applyWebDroppedFile(file, type);
    setActiveWebDropType(null);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const file = result.assets[0];

      const error = getFileValidationError(file.name || "", file.size, false);
      if (error) {
        Alert.alert("Invalid File", error);
        return;
      }

      setSelectedFile(result);
      setSelectedImage(null);
      setTitleFromSelectedFile(file.name || "");
    } catch (e) {
      console.error("Error picking document", e);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const image = result.assets[0];

      const error = getFileValidationError(
        image.fileName || "",
        image.fileSize,
        true,
      );
      if (error) {
        Alert.alert("Invalid Image", error);
        return;
      }

      setSelectedImage(image);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error picking image", error);
    }
  };

  const selectedPreviewAsset = (() => {
    if (selectedImage) {
      return {
        type: "image" as const,
        uri: selectedImage.uri,
        name: selectedImage.fileName || "Selected image",
      };
    }

    const file = selectedFile?.assets?.[0];
    if (!file) return null;

    const mimeType = (file.mimeType || "").toLowerCase();
    const fileName = file.name || "";
    const isPdf =
      mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    const isImage =
      mimeType.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName);

    if (isImage) {
      return { type: "image" as const, uri: file.uri, name: fileName };
    }

    if (isPdf) {
      return { type: "pdf" as const, uri: file.uri, name: fileName };
    }

    return null;
  })();

  const selectedSubject = subjects.find(
    (subject) => subject.name === formData.subject,
  );
  const selectedPaperCodePrefix =
    formData.level?.toLowerCase() === "ordinary"
      ? (selectedSubject?.ordinary ?? "")
      : formData.level?.toLowerCase() === "advanced"
        ? (selectedSubject?.advanced ?? "")
        : "";
  const subjectPaperCount =
    formData.level?.toLowerCase() === "ordinary"
      ? (selectedSubject?.ordinaryPapers ?? 0)
      : formData.level?.toLowerCase() === "advanced"
        ? (selectedSubject?.advancedPapers ?? 0)
        : 0;

  const paperCodeOptions = Array.from(
    { length: Math.max(subjectPaperCount, 0) },
    (_, index) => index + 1,
  );
  const shouldShowPaperCodeButtons = subjectPaperCount > 1;

  useEffect(() => {
    if (!formData.subject || !formData.level || !selectedPaperCodePrefix) {
      if (formData.paperCode) {
        updateField("paperCode", "");
      }
    }
  }, [
    formData.level,
    formData.paperCode,
    formData.subject,
    selectedPaperCodePrefix,
    updateField,
  ]);

  const yearPickerDate = getYearPickerDate(formData.extra || currentYear);

  const sanitizeYearInputValue = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    if (!numericValue) return "";

    if (numericValue.length < 4) return numericValue;

    const yearNumber = Number(numericValue);
    if (yearNumber < 1980) return "1980";
    if (yearNumber > currentYear) return String(currentYear);
    return numericValue;
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
    if (!isAuthorizedPublisher) {
      setInfoMessage(
        "Publishing access is restricted to teacher and admin accounts.",
      );
      showStatusDialog(
        "Publishing restricted",
        "Only teacher or admin users can publish books, pages, announcements, and past papers. Please switch to an approved account type to continue.",
        "Go back",
        () => {
          setStatusDialog(null);
          setInfoMessage("");
          handleClose();
        },
      );
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Sign in required", "You must be signed in to publish.");
      return;
    }

    const sanitizedTitle = normalizeText(formData.title);
    const sanitizedDescription = normalizeText(formData.subtitle);
    const sanitizedSubject = normalizeText(formData.subject);
    const sanitizedBookDescription = normalizeText(formData.description);
    const sanitizedAuthor = normalizeText(
      profile?.name || auth.currentUser?.displayName || "Unknown author",
    );

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const offlineMessage =
        "No internet connection detected. Please reconnect and try again.";
      setInfoMessage(offlineMessage);
      showStatusDialog(
        "No internet connection",
        "Your upload could not finish because this device is offline. Please reconnect and try again.",
        "Try again",
        () => {
          setStatusDialog(null);
          setInfoMessage("");
        },
      );
      return;
    }

    if (!sanitizedTitle) {
      Alert.alert("Title required", "Enter a title before saving the post.");
      return;
    }

    try {
      setIsSubmitting(true);
      uploadProgressRef.current = { document: 0, preview: 0 };
      setUploadProgress({
        active: true,
        label: "Preparing upload",
        progress: 8,
      });
      setInfoMessage(
        "Uploading your item. Please keep this screen open until the upload finishes.",
      );

      let createdItemId = "";
      let notificationType:
        | "book"
        | "page"
        | "lesson"
        | "announcement"
        | "paper" = "book";

      if (formType === "book") {
        let coverUrl = "";

        if (selectedImage) {
          const blob = await uriToBlob(selectedImage.uri);
          const itemId = `${getTitleDocId(sanitizedTitle)}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
          const ext = selectedImage.mimeType?.split("/")[1] || "jpg";
          coverUrl = await uploadAssetToStorage(
            `book-covers/${itemId}.${ext}`,
            blob,
            "Uploading cover image",
            updateUploadProgress,
            { contentType: selectedImage.mimeType || "image/jpeg" },
          );
        }

        createdItemId = await addBook(
          sanitizedTitle,
          sanitizedDescription,
          sanitizedSubject,
          coverUrl,
          sanitizedAuthor,
          userId,
        );
        notificationType = "book";
      } else if (formType === "banner") {
        let coverUrl = "";
        let documentUrl = "";
        const hasCover = Boolean(selectedImage || selectedFile?.assets?.[0]);
        const fileType = selectedImage
          ? "image"
          : selectedFile?.assets?.[0]
            ? "doc"
            : "";

        if (selectedImage) {
          const blob = await uriToBlob(selectedImage.uri);
          coverUrl = await uploadAssetToStorage(
            `post-covers/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`,
            blob,
            "Uploading announcement image",
            updateUploadProgress,
            { contentType: selectedImage.mimeType || "image/jpeg" },
          );
        } else if (selectedFile?.assets?.[0]) {
          const file = selectedFile.assets[0];
          const blob = await uriToBlob(file.uri);
          documentUrl = await uploadAssetToStorage(
            `post-documents/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.pdf`,
            blob,
            "Uploading announcement document",
            updateUploadProgress,
          );

          const coverDataUrl = await generatePdfFirstPageThumbnail(
            file.uri,
            setPdfToProcess,
            webViewRef,
          );
          const coverBlob = await uriToBlob(coverDataUrl);
          coverUrl = await uploadAssetToStorage(
            `post-covers/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`,
            coverBlob,
            "Uploading document",
            silentUploadProgress,
            { contentType: "image/jpeg" },
          );
        }

        createdItemId = await addBanner(
          sanitizedTitle,
          sanitizedDescription,
          sanitizedSubject,
          coverUrl,
          documentUrl,
          hasCover,
          fileType,
          userId,
          profile?.type || "",
        );
        notificationType = "announcement";
      } else if (formType === "page") {
        const bookList = formData.book
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        let documentUrl = formData.document.trim();
        let coverUrl = FALLBACK_ICON_URL;

        if (
          selectedFile &&
          !selectedFile.canceled &&
          selectedFile.assets &&
          selectedFile.assets.length > 0
        ) {
          const file = selectedFile.assets[0];
          const blob = await uriToBlob(file.uri);
          const uniqueName = `${Date.now()}_${file.name || "document"}`;
          documentUrl = await uploadAssetToStorage(
            `docs/${uniqueName}`,
            blob,
            "Uploading page document",
            updateUploadProgress,
          );

          try {
            const coverDataUrl = await generatePdfFirstPageThumbnail(
              file.uri,
              setPdfToProcess,
              webViewRef,
            );
            const coverBlob = await uriToBlob(coverDataUrl);
            const uniqueCoverId = `${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}.jpg`;
            coverUrl = await uploadAssetToStorage(
              `page-covers/${uniqueCoverId}`,
              coverBlob,
              "Uploading document",
              silentUploadProgress,
              { contentType: "image/jpeg" },
            );
          } catch (coverError: any) {
            console.error(
              "Failed to generate or upload cover image",
              coverError,
            );
            coverUrl = FALLBACK_ICON_URL;
          }
        }

        createdItemId = await addPage(
          sanitizedTitle,
          sanitizedBookDescription,
          sanitizedSubject,
          formData.level || "",
          normalizeText(formData.schoolClass),
          coverUrl,
          documentUrl,
          bookList,
        );
        notificationType = "page";
      } else if (formType === "paper") {
        let documentUrl = formData.document.trim();
        let coverUrl = FALLBACK_ICON_URL;
        let pageCount = 1;

        if (
          selectedFile &&
          !selectedFile.canceled &&
          selectedFile.assets &&
          selectedFile.assets.length > 0
        ) {
          const file = selectedFile.assets[0];
          const blob = await uriToBlob(file.uri);
          const uniqueName = `${Date.now()}_${file.name || "past-paper"}`;
          documentUrl = await uploadAssetToStorage(
            `past-papers/${uniqueName}`,
            blob,
            "Uploading past paper",
            updateUploadProgress,
          );

          try {
            const coverDataUrl = await generatePdfFirstPageThumbnail(
              file.uri,
              setPdfToProcess,
              webViewRef,
            );
            const coverBlob = await uriToBlob(coverDataUrl);
            const sanitizedFileName = sanitizeFileName(
              file.name || "past-paper",
            );
            const uniqueCoverId = `${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}_${sanitizedFileName}.jpg`;
            coverUrl = await uploadAssetToStorage(
              `page-covers/${uniqueCoverId}`,
              coverBlob,
              "Uploading document",
              silentUploadProgress,
              { contentType: "image/jpeg" },
            );
          } catch (coverError: any) {
            console.error(
              "Failed to generate or upload cover image",
              coverError,
            );
            coverUrl = FALLBACK_ICON_URL;
          }

          try {
            pageCount = await getPdfPageCount(
              file.uri,
              setPdfToProcess,
              webViewRef,
            );
          } catch (pageCountError: any) {
            console.error("Failed to read page count", pageCountError);
            pageCount = 1;
          }
        }

        createdItemId = await addPastPaper(
          sanitizedTitle,
          sanitizedBookDescription,
          sanitizedSubject,
          normalizeText(formData.level) || "",
          normalizeText(formData.author) || "UNEB",
          normalizeText(formData.extra) || String(new Date().getFullYear()),
          pageCount,
          coverUrl,
          documentUrl,
          normalizeText(formData.paperCode),
        );
        notificationType = "paper";
      }

      if (createdItemId && formData.notifyUsers) {
        await notifyUsersAboutNewItem(notificationType, createdItemId);
      }

      setFormData(INITIAL_FORM_STATE);
      setSelectedFile(null);
      setSelectedImage(null);
      setUploadProgress({
        active: false,
        label: "Upload complete",
        progress: 100,
      });
      setInfoMessage(
        "Upload complete. You can close this screen or continue editing.",
      );
      showStatusDialog(
        "Upload successful",
        "Your item was published successfully. You can stay here and continue publishing, or close this form whenever you're ready.",
        "Done",
        () => {
          setStatusDialog(null);
          setInfoMessage("");
        },
      );
    } catch (error: any) {
      console.error("Failed to add library item", error);
      const errorDetails = resolveUploadError(error);
      setInfoMessage(errorDetails.inline);
      showStatusDialog(
        errorDetails.title,
        errorDetails.message,
        errorDetails.primaryText,
        () => {
          setStatusDialog(null);
          setInfoMessage("");
        },
        errorDetails.title === "Upload failed" ? "Close" : undefined,
        errorDetails.title === "Upload failed"
          ? () => {
              setStatusDialog(null);
              setInfoMessage("");
            }
          : undefined,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const composerContent = (
    <View style={screen ? styles.screenContainer : styles.modalBackdrop}>
      {isAuthorizedPublisher ? (
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

            {infoMessage && !uploadProgress.active ? (
              <InfoMessage>{infoMessage}</InfoMessage>
            ) : null}

            {formType !== "paper" && (
              <>
                <FieldLabel>Title</FieldLabel>
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
                  maxLength={TITLE_MAX_LENGTH}
                />
                <CharacterCounter
                  current={formData.title.length}
                  maxLength={TITLE_MAX_LENGTH}
                />
              </>
            )}

            {formType === "book" && (
              <BookFormSection
                formData={formData}
                updateField={updateField}
                subjects={subjects}
                onSelectSubject={() =>
                  openOptionPicker(
                    "Select subject",
                    subjects.map((subject) => ({
                      label: subject.name,
                      value: subject.name,
                    })),
                    formData.subject,
                    (value) => updateField("subject", value),
                  )
                }
                selectedImage={selectedImage}
                pickImage={pickImage}
                authorName={
                  profile?.name ||
                  auth.currentUser?.displayName ||
                  "Your profile name"
                }
                authorAvatarSource={
                  profile?.photoURL && profile.photoURL.trim()
                    ? { uri: profile.photoURL }
                    : auth.currentUser?.photoURL &&
                        auth.currentUser.photoURL.trim()
                      ? { uri: auth.currentUser.photoURL }
                      : DEFAULT_USER_AVATAR
                }
                getWebDropHandlers={getWebDropHandlers}
                styles={styles}
              />
            )}

            {formType === "banner" && (
              <BannerFormSection
                formData={formData}
                updateField={updateField}
                subjects={subjects}
                onSelectSubject={() =>
                  openOptionPicker(
                    "Select subject",
                    subjects.map((subject) => ({
                      label: subject.name,
                      value: subject.name,
                    })),
                    formData.subject,
                    (value) => updateField("subject", value),
                  )
                }
                selectedFile={selectedFile}
                selectedImage={selectedImage}
                selectedPreviewAsset={selectedPreviewAsset}
                pickDocument={pickDocument}
                pickImage={pickImage}
                clearSelectedFile={clearSelectedFile}
                getWebDropHandlers={getWebDropHandlers}
                isSubmitting={isSubmitting}
                styles={styles}
              />
            )}

            {formType === "page" && (
              <PageFormSection
                formData={formData}
                updateField={updateField}
                subjects={subjects}
                subjectDropdownOpen={subjectDropdownOpen}
                setSubjectDropdownOpen={setSubjectDropdownOpen}
                levelDropdownOpen={levelDropdownOpen}
                setLevelDropdownOpen={setLevelDropdownOpen}
                classDropdownOpen={classDropdownOpen}
                setClassDropdownOpen={setClassDropdownOpen}
                selectedFile={selectedFile}
                selectedPreviewAsset={selectedPreviewAsset}
                pickDocument={pickDocument}
                clearSelectedFile={clearSelectedFile}
                getWebDropHandlers={getWebDropHandlers}
                isSubmitting={isSubmitting}
                styles={styles}
              />
            )}

            {formType === "paper" && (
              <PaperFormSection
                formData={formData}
                updateField={updateField}
                subjects={subjects}
                pastPaperTypes={pastPaperTypes}
                subjectDropdownOpen={subjectDropdownOpen}
                setSubjectDropdownOpen={setSubjectDropdownOpen}
                typeDropdownOpen={typeDropdownOpen}
                setTypeDropdownOpen={setTypeDropdownOpen}
                levelDropdownOpen={levelDropdownOpen}
                setLevelDropdownOpen={setLevelDropdownOpen}
                showYearPicker={showYearPicker}
                setShowYearPicker={setShowYearPicker}
                currentYear={currentYear}
                yearPickerDate={yearPickerDate}
                selectedFile={selectedFile}
                selectedPreviewAsset={selectedPreviewAsset}
                pickDocument={pickDocument}
                clearSelectedFile={clearSelectedFile}
                getWebDropHandlers={getWebDropHandlers}
                sanitizeYearInput={sanitizeYearInputValue}
                isSubmitting={isSubmitting}
                styles={styles}
              />
            )}

            <View style={styles.notifySection}>
              <View style={styles.notifySectionContent}>
                <View>
                  <Text style={styles.notifyLabel}>Notify Community</Text>
                  <Text style={styles.notifyDescription}>
                    Send notifications to users about this post
                  </Text>
                </View>
                <NotifyToggle
                  checked={formData.notifyUsers}
                  onToggle={() =>
                    updateField("notifyUsers", !formData.notifyUsers)
                  }
                />
              </View>
            </View>

            <ModalActionBar
              onCancel={handleClose}
              onSubmit={handleAddItem}
              isSubmitting={isSubmitting}
              submitLabel={isSubmitting ? "Saving..." : "Save"}
            />
          </ScrollView>
        </View>
      ) : (
        <ActionDialog
          visible={visible}
          title="Publishing restricted"
          message="Only teacher or admin users can publish books, pages, announcements, and past papers. Please switch to an approved account type to continue."
          primaryText="Go back"
          onPrimary={handleClose}
          onClose={handleClose}
          icon={<Icon name="alert-circle" size={24} color="#DC2626" />}
        />
      )}
      <UploadStatusModal
        visible={uploadProgress.active}
        title={uploadProgress.label || "Uploading"}
        message={
          infoMessage ||
          "Uploading your item. Please keep this screen open until the upload finishes."
        }
        progress={uploadProgress.progress}
      />
      <OptionPickerModal
        visible={Boolean(pickerConfig)}
        title={pickerConfig?.title ?? "Select an option"}
        options={pickerConfig?.options ?? []}
        selectedValue={pickerConfig?.selectedValue}
        onClose={closeOptionPicker}
        onSelect={(value) => {
          pickerConfig?.onSelect(value);
          closeOptionPicker();
        }}
      />
      {pdfToProcess && Platform.OS !== "web" && (
        <View style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}>
          <WebView
            ref={webViewRef}
            source={{ html: getWebViewHtml() }}
            onMessage={(event: any) => {
              try {
                const res = JSON.parse(event.nativeEvent.data);
                if (res.status === "ready") {
                  webViewRef.current?.postMessage(
                    JSON.stringify({
                      base64Data: pdfToProcess.base64Data,
                      mode: pdfToProcess.mode ?? "cover",
                    }),
                  );
                } else if (res.status === "success") {
                  const result =
                    pdfToProcess.mode === "pageCount"
                      ? (res.pageCount ?? 1)
                      : res.dataUrl;
                  pdfToProcess.resolve(result);
                  setPdfToProcess(null);
                } else {
                  pdfToProcess.reject(
                    new Error(res.error || "Unknown rendering error"),
                  );
                  setPdfToProcess(null);
                }
              } catch (e) {
                pdfToProcess.reject(e);
                setPdfToProcess(null);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}
      {statusDialog && (
        <ActionDialog
          visible={statusDialog.visible}
          title={statusDialog.title}
          message={statusDialog.message}
          primaryText={statusDialog.primaryText}
          secondaryText={statusDialog.secondaryText}
          onPrimary={statusDialog.onPrimary}
          onSecondary={statusDialog.onSecondary}
          onClose={() => {
            setStatusDialog(null);
            if (statusDialog.onSecondary) {
              statusDialog.onSecondary();
            }
          }}
          icon={
            <Icon
              name={
                statusDialog.title.includes("successful")
                  ? "check-circle"
                  : "alert-circle"
              }
              size={24}
              color={
                statusDialog.title.includes("successful")
                  ? "#16A34A"
                  : "#DC2626"
              }
            />
          }
        />
      )}
    </View>
  );

  if (screen) return composerContent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
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
    borderColor: "rgba(37, 99, 235, 0.24)",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    cursor: "pointer",
  },
  filePickerPressed: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.45)",
  },
  filePickerSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.38)",
  },
  filePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filePickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  filePickerTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  filePickerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  filePickerHint: {
    color: "#4B6AA6",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  attachmentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  attachmentButton: {
    flex: 1,
    minHeight: 70,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    justifyContent: "center",
    cursor: "pointer",
  },
  attachmentButtonPressed: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.55)",
  },
  attachmentButtonSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderColor: "rgba(37, 99, 235, 0.35)",
  },
  attachmentButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachmentButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentButtonTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  attachmentButtonText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
  },
  attachmentButtonHint: {
    color: "#4B6AA6",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
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
  titleCharacterCount: {
    alignSelf: "flex-end",
    color: colors.subtitle,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    color: "#1D4ED8",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.md,
  },
  twoColumnField: {
    flex: 1,
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
  readOnlyField: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.18)",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.md,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  readOnlyFieldText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  coverPreview: {
    width: 112,
    height: 148,
    borderRadius: 12,
    marginBottom: spacing.md,
    resizeMode: "cover",
  },
  previewContainer: {
    marginBottom: spacing.md,
  },
  coverPreviewFrame: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: colors.white,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  previewRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    zIndex: 1,
  },
  paperCodeSection: {
    marginBottom: spacing.md,
  },
  paperCodeInput: {
    borderWidth: 1,
    borderColor: "#DCE3ED",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  paperCodeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paperCodeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  paperCodeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paperCodeChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  paperCodeChipTextSelected: {
    color: colors.white,
  },
  documentPreviewImage: {
    width: 112,
    height: 148,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#F3F4F6",
  },
  documentPreviewPdf: {
    width: 112,
    height: 148,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
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
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  notifySection: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  notifySectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifyLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  notifyDescription: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCE3ED",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleCircleActive: {
    backgroundColor: colors.white,
  },
});
