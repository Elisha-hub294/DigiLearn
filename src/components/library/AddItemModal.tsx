import { Feather as Icon } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db, storage } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../../services/notifications";
import PdfPreview from "../home/PdfPreview";
import { AdminPublishHeader } from "./AdminPublishHeader";

let WebView: any = null;
let FileSystem: any = null;

if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
    FileSystem = require("expo-file-system");
  } catch (error) {
    console.error("Failed to load native dependencies in AddItemModal:", error);
  }
}

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
  notifyUsers: boolean;
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
  notifyUsers: true,
};

const FALLBACK_ICON_URL = "icons/default-2d.png";
const TITLE_MAX_LENGTH = 100;
const DEFAULT_USER_AVATAR = require("../../../assets/images/user-default.png");

const normalizeText = (value: string) =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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

const webviewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  </script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: white; }
    canvas { display: none; }
  </style>
</head>
<body>
  <canvas id="pdf-canvas"></canvas>
  <script>
    // Signal to React Native that we are ready
    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'ready' }));
      }
    }, 150);

    window.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.base64Data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: 'No PDF data provided' }));
          return;
        }

        const { base64Data, mode = 'cover' } = data;
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale: 1.0 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        if (mode === 'pageCount') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', pageCount: pdf.numPages || 1 }));
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', dataUrl }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: err.message || String(err) }));
      }
    });
  </script>
</body>
</html>
`;

const generatePdfFirstPageThumbnail = async (
  fileUri: string,
  setPdfToProcess: (state: any) => void,
  webViewRef: React.RefObject<any>,
): Promise<string> => {
  if (Platform.OS === "web") {
    const pdfjsLib = await new Promise<any>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(lib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    const loadingTask = pdfjsLib.getDocument({
      url: fileUri,
      withCredentials: false,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");

    const viewport = page.getViewport({ scale: 1.0 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } else {
    if (!FileSystem) {
      throw new Error("FileSystem native module is not loaded");
    }
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return new Promise<string>((resolve, reject) => {
      setPdfToProcess({
        base64Data,
        resolve,
        reject,
      });
    });
  }
};

const getPdfPageCount = async (
  fileUri: string,
  setPdfToProcess: (state: any) => void,
  webViewRef: React.RefObject<any>,
): Promise<number> => {
  if (Platform.OS === "web") {
    const pdfjsLib = await new Promise<any>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(lib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    const pdf = await pdfjsLib.getDocument({
      url: fileUri,
      withCredentials: false,
    }).promise;

    return pdf.numPages || 1;
  }

  if (!FileSystem) {
    throw new Error("FileSystem native module is not loaded");
  }

  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return new Promise<number>((resolve, reject) => {
    setPdfToProcess({
      base64Data,
      resolve: (result: any) => resolve(Number(result) || 1),
      reject,
      mode: "pageCount",
    });
  });
};

export function AddItemModal({
  visible,
  formType,
  onClose,
  onSuccess,
  screen = false,
}: AddItemModalProps) {
  const { profile } = useProfile();
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [pdfToProcess, setPdfToProcess] = useState<{
    base64Data: string;
    resolve: (value: any) => void;
    reject: (err: any) => void;
    mode?: "cover" | "pageCount";
  } | null>(null);
  const webViewRef = useRef<any>(null);

  const handleClose = () => {
    setPdfToProcess(null);
    onClose();
  };

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

    if (
      (formType === "book" ||
        formType === "page" ||
        formType === "paper" ||
        formType === "banner") &&
      visible
    ) {
      fetchSubjects();
    }
  }, [formType, visible]);

  const updateField = (key: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedImage(null);
  };

  const isAllowedDocument = (fileName: string, mimeType?: string | null) => {
    const lowerName = fileName.toLowerCase();
    const lowerMime = (mimeType || "").toLowerCase();

    return (
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerMime === "application/pdf" ||
      lowerMime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  const isAllowedImage = (fileName: string, mimeType?: string | null) => {
    const lowerName = fileName.toLowerCase();
    const lowerMime = (mimeType || "").toLowerCase();

    return (
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerMime === "image/jpeg" ||
      lowerMime === "image/png"
    );
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
      const fileName = file.name || "";
      const mimeType = file.mimeType || "";

      if (!isAllowedDocument(fileName, mimeType)) {
        Alert.alert(
          "Unsupported file type",
          "Please select a PDF or DOCX file only.",
        );
        return;
      }

      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "Please select a file smaller than 5 MB.",
        );
        return;
      }
      setSelectedFile(result);
      setSelectedImage(null);
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
      const fileName = image.fileName || "";
      const mimeType = image.mimeType || "";

      if (!isAllowedImage(fileName, mimeType)) {
        Alert.alert(
          "Unsupported image type",
          "Please select a JPG, JPEG, or PNG image only.",
        );
        return;
      }

      if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          "Image Too Large",
          "Please select an image smaller than 5 MB.",
        );
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
    const sanitizedTitle = normalizeText(formData.title);
    const sanitizedDescription = normalizeText(formData.subtitle);
    const sanitizedSubject = normalizeText(formData.subject);
    const sanitizedBookDescription = normalizeText(formData.description);
    const sanitizedAuthor = normalizeText(
      profile?.name || auth.currentUser?.displayName || "Unknown author",
    );

    if (!sanitizedTitle) {
      Alert.alert("Title required", "Enter a title before saving the post.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: sanitizedTitle,
      };

      let createdItemId = "";
      let notificationType:
        | "book"
        | "page"
        | "lesson"
        | "announcement"
        | "paper" = "book";

      if (formType === "book") {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          Alert.alert(
            "Sign in required",
            "You must be signed in to add a book.",
          );
          setIsSubmitting(false);
          return;
        }

        const itemId = `${getTitleDocId(sanitizedTitle)}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        let coverUrl = "";

        if (selectedImage) {
          try {
            const coverRef = ref(
              storage,
              `book-covers/${itemId}.${selectedImage.mimeType?.split("/")[1] || "jpg"}`,
            );
            await uploadBytes(coverRef, await uriToBlob(selectedImage.uri), {
              contentType: selectedImage.mimeType || "image/jpeg",
            });
            coverUrl = await getDownloadURL(coverRef);
          } catch (error: any) {
            Alert.alert(
              "Upload Failed",
              `Unable to upload the cover: ${error?.message || error}`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        createdItemId = itemId;
        notificationType = "book";
        await setDoc(doc(db, "books", itemId), {
          ...payload,
          author: sanitizedAuthor,
          owner: currentUserId,
          subject: sanitizedSubject || "General",
          description: sanitizedDescription,
          cover: coverUrl,
          updatedAt: serverTimestamp(),
        });
      } else if (formType === "banner") {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          Alert.alert(
            "Sign in required",
            "You must be signed in to add a banner.",
          );
          setIsSubmitting(false);
          return;
        }

        let coverUrl = "";
        let documentUrl = "";
        const hasCover = Boolean(selectedImage || selectedFile?.assets?.[0]);
        const fileType = selectedImage
          ? "image"
          : selectedFile?.assets?.[0]
            ? "doc"
            : "";
        const bannerId = `${getTitleDocId(sanitizedTitle)}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        try {
          if (selectedImage) {
            const imageRef = ref(
              storage,
              `post-covers/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`,
            );
            await uploadBytes(imageRef, await uriToBlob(selectedImage.uri));
            coverUrl = await getDownloadURL(imageRef);
          } else if (selectedFile?.assets?.[0]) {
            const file = selectedFile.assets[0];
            const uniqueDocumentId = `${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 9)}`;
            const documentRef = ref(
              storage,
              `post-documents/${uniqueDocumentId}.pdf`,
            );
            await uploadBytes(documentRef, await uriToBlob(file.uri));
            documentUrl = await getDownloadURL(documentRef);

            const coverDataUrl = await generatePdfFirstPageThumbnail(
              file.uri,
              setPdfToProcess,
              webViewRef,
            );
            const coverRef = ref(
              storage,
              `post-covers/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`,
            );
            await uploadBytes(coverRef, await uriToBlob(coverDataUrl));
            coverUrl = await getDownloadURL(coverRef);
          }
        } catch (error: any) {
          Alert.alert(
            "Upload Failed",
            `Unable to upload the cover: ${error?.message || error}`,
          );
          setIsSubmitting(false);
          return;
        }

        createdItemId = bannerId;
        notificationType = "announcement";
        await setDoc(doc(db, "teacherPosts", bannerId), {
          title: sanitizedTitle,
          descriprion: sanitizedDescription,
          hasCover,
          cover: coverUrl,
          document: documentUrl,
          createdAt: serverTimestamp(),
          subject: sanitizedSubject || "General",
          owner: currentUserId,
          ownerType: profile?.type || "",
          fileType,
        });
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

            // Auto generate the file's first page image and store it in Firebase Storage
            try {
              console.log("Generating first page cover thumbnail...");
              const coverDataUrl = await generatePdfFirstPageThumbnail(
                file.uri,
                setPdfToProcess,
                webViewRef,
              );
              console.log("Generated cover data URL successfully.");

              const coverBlob = await uriToBlob(coverDataUrl);
              const uniqueCoverId = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}.jpg`;
              const coverRef = ref(storage, `page-covers/${uniqueCoverId}`);
              await uploadBytes(coverRef, coverBlob);
              coverUrl = await getDownloadURL(coverRef);
              console.log("Uploaded cover successfully: ", coverUrl);
            } catch (coverError: any) {
              console.error(
                "Failed to generate or upload cover image",
                coverError,
              );
              coverUrl = FALLBACK_ICON_URL;
            }
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
          description: sanitizedBookDescription || "",
          document: documentUrl,
          level: formData.level || "Ordinary",
          subject: sanitizedSubject || "General",
          title: sanitizedTitle,
          updatedAt: serverTimestamp(),
          ...(normalizeText(formData.schoolClass)
            ? { schoolClass: normalizeText(formData.schoolClass) }
            : {}),
        });
      } else if (formType === "paper") {
        const paperTitle = formData.title.trim() || "untitled-paper";
        const itemId = `${getTitleDocId(paperTitle)}-${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        createdItemId = itemId;
        notificationType = "paper";

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
          try {
            const blob = await uriToBlob(file.uri);
            const uniqueName = `${Date.now()}_${file.name || "past-paper"}`;
            const storageRef = ref(storage, `past-papers/${uniqueName}`);
            await uploadBytes(storageRef, blob);
            documentUrl = await getDownloadURL(storageRef);

            try {
              console.log("Generating past paper cover thumbnail...");
              const coverDataUrl = await generatePdfFirstPageThumbnail(
                file.uri,
                setPdfToProcess,
                webViewRef,
              );
              console.log("Generated past paper cover data URL successfully.");

              const coverBlob = await uriToBlob(coverDataUrl);
              const uniqueCoverId = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}.jpg`;
              const coverRef = ref(
                storage,
                `past-paper-covers/${uniqueCoverId}`,
              );
              await uploadBytes(coverRef, coverBlob);
              coverUrl = await getDownloadURL(coverRef);
              console.log("Uploaded past paper cover successfully: ", coverUrl);
            } catch (coverError: any) {
              console.error(
                "Failed to generate or upload past paper cover image",
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
              console.error(
                "Failed to read past paper page count",
                pageCountError,
              );
              pageCount = 1;
            }
          } catch (e: any) {
            console.error("Past paper file upload failed", e);
            Alert.alert(
              "Upload Failed",
              `Unable to upload the selected document: ${e?.message || e}`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        await setDoc(doc(db, "pastPaper", itemId), {
          title: sanitizedTitle,
          description: sanitizedBookDescription || "",
          subject: sanitizedSubject || "General",
          document: documentUrl || "",
          cover: coverUrl,
          pageNumber: pageCount,
          type: normalizeText(formData.author) || "UNEB",
          year:
            normalizeText(formData.extra) || String(new Date().getFullYear()),
          updatedAt: serverTimestamp(),
        });
      }

      if (createdItemId && formData.notifyUsers) {
        await appendNotificationToAllUsers(
          buildLibraryNotification(notificationType, createdItemId),
        );
      }

      setFormData(INITIAL_FORM_STATE);
      setSelectedFile(null);
      setSelectedImage(null);
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

          {formType !== "paper" && (
            <>
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
                maxLength={TITLE_MAX_LENGTH}
              />
              <Text style={styles.titleCharacterCount}>
                {formData.title.length}/{TITLE_MAX_LENGTH}
              </Text>
            </>
          )}

          {formType === "book" && (
            <>
              <Text style={styles.fieldLabel}>Author</Text>
              <View style={styles.readOnlyField}>
                <Image
                  source={
                    profile?.photoURL && profile.photoURL.trim()
                      ? { uri: profile.photoURL }
                      : auth.currentUser?.photoURL &&
                          auth.currentUser.photoURL.trim()
                        ? { uri: auth.currentUser.photoURL }
                        : DEFAULT_USER_AVATAR
                  }
                  style={styles.authorAvatar}
                />
                <Text style={styles.readOnlyFieldText}>
                  {profile?.name ||
                    auth.currentUser?.displayName ||
                    "Your profile name"}
                </Text>
              </View>
              <Text style={styles.fieldLabel}>Subject</Text>
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select book subject"
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
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Book description"
                value={formData.subtitle}
                onChangeText={(val) => updateField("subtitle", val)}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.fieldLabel}>Cover</Text>
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
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.coverPreview}
                />
              )}

              {/* <Text style={styles.fieldLabel}>top</Text>
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
              </View> */}
            </>
          )}

          {formType === "banner" && (
            <>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short description"
                value={formData.subtitle}
                onChangeText={(val) => updateField("subtitle", val)}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.fieldLabel}>Subject</Text>
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select subject"
                  style={styles.dropdownTrigger}
                  onPress={() => setSubjectDropdownOpen((prev) => !prev)}
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
                        <Text style={styles.dropdownItemText}>
                          {option.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.fieldLabel}>Attachment</Text>
              <View style={styles.attachmentRow}>
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
          )}

          {formType === "page" && (
            <>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Page description"
                value={formData.description}
                onChangeText={(val) => updateField("description", val)}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.fieldLabel}>Subject</Text>
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select subject"
                  style={styles.dropdownTrigger}
                  onPress={() => setSubjectDropdownOpen((prev) => !prev)}
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
                  <View style={styles.dropdownContent}>
                    <Icon name="layers" size={16} color={colors.primary} />
                    <Text style={styles.dropdownText}>{formData.level}</Text>
                  </View>
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
                  <View style={styles.dropdownContent}>
                    <Icon name="users" size={16} color={colors.primary} />
                    <Text style={styles.dropdownText}>
                      {formData.schoolClass || "Select class"}
                    </Text>
                  </View>
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

              <Text style={styles.fieldLabel}>Document File</Text>
              <Pressable
                style={styles.filePicker}
                onPress={pickDocument}
                disabled={isSubmitting}
              >
                <View style={styles.filePickerContent}>
                  <Icon name="file-text" size={16} color={colors.primary} />
                  <Text style={styles.filePickerText}>
                    {selectedFile?.assets?.[0]
                      ? selectedFile.assets[0].name
                      : "Tap to select a file (max 5 MB)"}
                  </Text>
                </View>
              </Pressable>
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
              {/* <Text style={styles.fieldLabel}>Book</Text>
              <TextInput
                style={styles.input}
                placeholder="Book A, Book B, Book C"
                value={formData.book}
                onChangeText={(val) => updateField("book", val)}
              /> */}
            </>
          )}

          {formType === "paper" && (
            <>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Paper title"
                value={formData.title}
                onChangeText={(val) => updateField("title", val)}
                maxLength={TITLE_MAX_LENGTH}
              />
              <Text style={styles.titleCharacterCount}>
                {formData.title.length}/{TITLE_MAX_LENGTH}
              </Text>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of this paper"
                value={formData.description}
                onChangeText={(val) => updateField("description", val)}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.fieldLabel}>Subject</Text>
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select subject"
                  style={styles.dropdownTrigger}
                  onPress={() => setSubjectDropdownOpen((prev) => !prev)}
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
              <Text style={styles.fieldLabel}>Document file</Text>
              <Pressable
                style={styles.filePicker}
                onPress={pickDocument}
                disabled={isSubmitting}
              >
                <View style={styles.filePickerContent}>
                  <Icon name="file-text" size={16} color={colors.primary} />
                  <Text style={styles.filePickerText}>
                    {selectedFile?.assets?.[0]
                      ? selectedFile.assets[0].name
                      : "Tap to select a document (max 5 MB)"}
                  </Text>
                </View>
              </Pressable>
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
              <Text style={styles.fieldLabel}>Type</Text>
              <TextInput
                style={styles.input}
                placeholder="UNEB / Mock / Final"
                value={formData.author}
                onChangeText={(val) => updateField("author", val)}
              />
              <Text style={styles.fieldLabel}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="2026"
                value={formData.extra}
                onChangeText={(val) => updateField("extra", val)}
                keyboardType="numeric"
              />
            </>
          )}

          <View style={styles.notifySection}>
            <View style={styles.notifySectionContent}>
              <View>
                <Text style={styles.notifyLabel}>Notify Community</Text>
                <Text style={styles.notifyDescription}>
                  Send notifications to users about this post
                </Text>
              </View>
              <Pressable
                style={[
                  styles.toggleSwitch,
                  formData.notifyUsers && styles.toggleSwitchActive,
                ]}
                onPress={() =>
                  updateField("notifyUsers", !formData.notifyUsers)
                }
                accessibilityRole="switch"
                accessibilityLabel="Notify Community"
                accessibilityState={{ checked: formData.notifyUsers }}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    formData.notifyUsers && styles.toggleCircleActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={handleClose}
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
      {pdfToProcess && Platform.OS !== "web" && WebView && (
        <View style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}>
          <WebView
            ref={webViewRef}
            source={{ html: webviewHtml }}
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
    borderColor: "rgba(37, 99, 235, 0.28)",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    justifyContent: "center",
  },
  filePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filePickerText: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  attachmentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  attachmentButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.28)",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.06)",
  },
  attachmentButtonText: {
    flex: 1,
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
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
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "#F5F7FA",
  },
  readOnlyFieldText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
