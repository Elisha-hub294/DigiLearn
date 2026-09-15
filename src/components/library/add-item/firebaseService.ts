import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { File, UploadType } from "expo-file-system";
import { Platform } from "react-native";
import { auth, db, storage } from "../../../../firebaseConfig";
import { invalidateFirestoreReadCache } from "../../../services/firestoreReadCache";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../../../services/notifications";
import {
  invalidateLocalCaches,
  LOCAL_CACHE_KEYS,
} from "../../../utils/localCache";
import { resolveTeacherPublisherProfile } from "../../../utils/teacherNotificationPublisher";
import { getVideoThumbnailUrl } from "../../../utils/videoUtils";
import { getTitleDocId } from "./utils";

export interface UploadProgressCallback {
  (label: string, progress: number): void;
}

type NativeUploadFile = File;

function isNativeUploadFile(value: unknown): value is NativeUploadFile {
  return Platform.OS !== "web" && value instanceof File;
}

async function uploadNativeFileToStorage(
  path: string,
  file: NativeUploadFile,
  label: string,
  onProgress: UploadProgressCallback,
  contentType: string,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Sign in again before uploading a document.");
  }

  if (!file.exists || !file.size) {
    throw new Error("The selected file is unavailable or empty. Please choose it again.");
  }

  const bucket = storage.app.options.storageBucket;
  if (!bucket) {
    throw new Error("Firebase Storage is not configured for this app.");
  }

  const idToken = await user.getIdToken();
  const uploadStartUrl =
    `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o` +
    `?name=${encodeURIComponent(path)}`;
  const authHeader = `Firebase ${idToken}`;

  // Start a Firebase resumable session with a small JSON request. The PDF is
  // never read into JavaScript; Expo's native networking uploads it from disk.
  const startResponse = await fetch(uploadStartUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json; charset=utf-8",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(file.size),
      "X-Goog-Upload-Header-Content-Type": contentType,
    },
    body: JSON.stringify({
      fullPath: path,
      size: file.size,
      contentType,
    }),
  });

  const sessionUrl = startResponse.headers.get("x-goog-upload-url");
  const sessionStatus = startResponse.headers.get("x-goog-upload-status");
  if (!startResponse.ok || !sessionUrl || sessionStatus !== "active") {
    const responseText = await startResponse.text().catch(() => "");
    throw new Error(
      `Could not start the document upload (${startResponse.status}). ${responseText}`,
    );
  }

  const result = await file.upload(sessionUrl, {
    httpMethod: "POST",
    uploadType: UploadType.BINARY_CONTENT,
    mimeType: contentType,
    sessionType: "foreground",
    headers: {
      Authorization: authHeader,
      "Content-Type": contentType,
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
    },
    onProgress: ({ bytesSent, totalBytes }) => {
      const total = totalBytes > 0 ? totalBytes : file.size;
      const progress = total > 0 ? Math.round((bytesSent / total) * 100) : 0;
      onProgress(label, Math.max(0, Math.min(progress, 100)));
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `Document upload failed (${result.status}). ${result.body || "No response body."}`,
    );
  }

  onProgress(label, 100);
  return getDownloadURL(ref(storage, path));
}

/**
 * Uploads an asset to Firebase Storage with progress tracking.
 * Native callers pass Expo File objects (Blob-compatible) directly, avoiding
 * base64 expansion before Firebase's resumable uploader streams the file.
 */
export const uploadAssetToStorage = async (
  path: string,
  blob: Blob | Uint8Array | ArrayBuffer,
  label: string,
  onProgress: UploadProgressCallback,
  metadata?: { contentType?: string },
): Promise<string> => {
  const effectiveMetadata = {
    ...metadata,
    contentType:
      metadata?.contentType ||
      (blob as any)?.type ||
      "application/octet-stream",
  };

  if (isNativeUploadFile(blob)) {
    return uploadNativeFileToStorage(
      path,
      blob,
      label,
      onProgress,
      effectiveMetadata.contentType,
    );
  }

  const storageRef = ref(storage, path);

  return new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, effectiveMetadata);

    task.on(
      "state_changed",
      (snapshot) => {
        const nextProgress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );
        onProgress(label, nextProgress);
      },
      (error) => {
        onProgress(label, 0);
        reject(
          new Error(
            `Storage upload failed for ${path}: ${error.code || error.message || String(error)}`,
            { cause: error },
          ),
        );
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          onProgress(label, 100);
          resolve(downloadUrl);
        } catch (error) {
          onProgress(label, 0);
          reject(error);
        }
      },
    );
  });
};

/**
 * Fetches available subjects from database
 */
export const fetchSubjects = async (): Promise<
  {
    id: string;
    name: string;
    ordinary?: string;
    advanced?: string;
    subsidiary?: string;
    isSubsidiary?: boolean;
    ordinaryPapers?: number;
    advancedPapers?: number;
    subsidiaryPapers?: number;
  }[]
> => {
  try {
    const snapshot = await getDocs(collection(db, "subject"));
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const ordinaryPapers =
          typeof data.ordinaryPapers === "number"
            ? data.ordinaryPapers
            : Number(data.ordinaryPapers) || 0;
        const advancedPapers =
          typeof data.advancedPapers === "number"
            ? data.advancedPapers
            : Number(data.advancedPapers) || 0;
        const subsidiaryPapers =
          typeof data.subsidiaryPapers === "number"
            ? data.subsidiaryPapers
            : Number(data.subsidiaryPapers) || 0;

        return {
          id: doc.id,
          name: (data.name as string) || "",
          ordinary: (data.ordinary as string) || "",
          advanced: (data.advanced as string) || "",
          subsidiary: (data.subsidiary as string) || "",
          isSubsidiary: Boolean(data.isSubsidiary),
          ordinaryPapers,
          advancedPapers,
          subsidiaryPapers,
        };
      })
      .filter((item) => item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

/**
 * Fetches available past paper types from database
 */
export const fetchPastPaperTypes = async (): Promise<
  { id: string; name: string }[]
> => {
  try {
    const snapshot = await getDocs(collection(db, "pastPaperType"));
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name as string,
      }))
      .filter((item) => item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching past paper types:", error);
    return [];
  }
};

/**
 * Adds a book to the database
 */
export const addBook = async (
  title: string,
  subtitle: string,
  subject: string,
  coverUrl: string,
  author: string,
  userId: string,
  sampleUrl = "",
) => {
  const itemId = `${getTitleDocId(title)}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  await setDoc(doc(db, "books", itemId), {
    title,
    author,
    owner: userId,
    subject: subject || "General",
    description: subtitle,
    cover: coverUrl,
    ...(sampleUrl ? { sampleUrl } : {}),
    updatedAt: serverTimestamp(),
  });
  await invalidateLocalCaches(
    LOCAL_CACHE_KEYS.library,
    LOCAL_CACHE_KEYS.search,
    LOCAL_CACHE_KEYS.books,
  );
  invalidateFirestoreReadCache("collection:books");

  return itemId;
};

/**
 * Adds a banner/announcement to the database
 */
export const addBanner = async (
  title: string,
  description: string,
  subject: string,
  coverUrl: string,
  documentUrl: string,
  hasCover: boolean,
  fileType: string,
  userId: string,
  userType: string,
  images: string[] = [],
) => {
  const bannerId = `${getTitleDocId(title)}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const finalImages = images.length > 0 ? images : coverUrl ? [coverUrl] : [];

  await setDoc(doc(db, "teacherPosts", bannerId), {
    title,
    descriprion: description,
    description,
    hasCover,
    cover: coverUrl || (finalImages[0] ?? ""),
    images: finalImages,
    document: documentUrl,
    createdAt: serverTimestamp(),
    subject: subject || "General",
    owner: userId,
    ownerType: userType || "",
    fileType,
  });
  await invalidateLocalCaches(LOCAL_CACHE_KEYS.library);
  invalidateFirestoreReadCache(
    "collection:teacherPosts",
    "collection:promotionalBanner",
  );

  return bannerId;
};

/**
 * Adds a page to the database
 */
export const addPage = async (
  title: string,
  description: string,
  subject: string,
  level: string,
  schoolClass: string,
  coverUrl: string,
  documentUrl: string,
  books: string[],
  userId: string,
) => {
  const itemId = `${getTitleDocId(title)}-${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  await setDoc(doc(db, "pages", itemId), {
    book: books,
    cover: coverUrl,
    description: description || "",
    document: documentUrl,
    level: level || "",
    visits: 0,
    subject: subject || "General",
    title,
    owner: userId,
    updatedAt: serverTimestamp(),
    ...(schoolClass ? { schoolClass } : {}),
  });
  await invalidateLocalCaches(
    LOCAL_CACHE_KEYS.library,
    LOCAL_CACHE_KEYS.search,
  );
  invalidateFirestoreReadCache("collection:pages");

  return itemId;
};

/**
 * Adds a past paper to the database
 */
export const addPastPaper = async (
  title: string,
  description: string,
  subject: string,
  level: string,
  type: string,
  year: string,
  pageCount: number,
  coverUrl: string,
  documentUrl: string,
  paperCode: string,
  userId: string,
) => {
  const itemId = `${getTitleDocId(title)}-${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const normalizedPaperCode = paperCode.trim();
  const hasPaperSuffix = normalizedPaperCode.includes("/");
  const [basePaperCode, rawPaperNumber] = normalizedPaperCode.split("/");
  const parsedPaperNumber = Number(rawPaperNumber ?? "1");
  const savedPaperNumber = Number.isFinite(parsedPaperNumber)
    ? parsedPaperNumber
    : 1;
  const savedPaperCode = (hasPaperSuffix ? basePaperCode : normalizedPaperCode)
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

  await setDoc(doc(db, "pastPaper", itemId), {
    title,
    description: description || "",
    subject: subject || "General",
    document: documentUrl || "",
    cover: coverUrl,
    pageNumber: pageCount,
    ...(savedPaperCode ? { paperNumber: savedPaperNumber } : {}),
    type: type || "UNEB",
    level: level || "",
    year,
    paperCode: savedPaperCode || "",
    owner: userId,
    updatedAt: serverTimestamp(),
  });
  await invalidateLocalCaches(
    LOCAL_CACHE_KEYS.library,
    LOCAL_CACHE_KEYS.search,
  );
  invalidateFirestoreReadCache("collection:pastPaper");

  return itemId;
};

/**
 * Sends a new library item notification to its intended recipients.
 * Teacher announcements go only to that teacher's community followers.
 */
export const notifyUsersAboutNewItem = async (
  itemType: "book" | "page" | "lesson" | "announcement" | "paper",
  itemId: string,
  resourceTitle?: string,
) => {
  try {
    // The server fan-outs announcements to followers on document creation.
    // Do not also use the client callable path or followers receive duplicates.
    if (itemType === "announcement") return;
    const collectionName =
      itemType === "book"
        ? "books"
        : itemType === "page"
          ? "pages"
          : itemType === "paper"
            ? "pastPaper"
            : "trendingLessons";
    const itemSnapshot = await getDoc(doc(db, collectionName, itemId));
    const item = itemSnapshot.data();
    const previewImage =
      itemType === "lesson"
        ? getVideoThumbnailUrl(
            typeof item?.thumbnail === "string" ? item.thumbnail : undefined,
            typeof item?.link === "string" ? item.link : undefined,
          )
        : typeof item?.cover === "string"
          ? item.cover.trim()
          : undefined;

    const ownerId =
      typeof item?.owner === "string" && item.owner.trim() ? item.owner : "";

    const teacherProfile = ownerId
      ? await Promise.all([
          getDoc(doc(db, "teachers", ownerId)),
          getDoc(doc(db, "users", ownerId)),
        ]).then(([teacherSnapshot, userSnapshot]) => {
          const teacherData = teacherSnapshot.exists()
            ? (teacherSnapshot.data() ?? {})
            : {};
          const userData = userSnapshot.exists()
            ? (userSnapshot.data() ?? {})
            : {};
          return teacherSnapshot.exists() &&
            (teacherData?.type === "teacher" ||
              typeof teacherData?.teacherApprovalStatus === "string")
            ? teacherData
            : userData?.type === "teacher"
              ? userData
              : null;
        })
      : null;

    const resolvedPublisher = teacherProfile
      ? resolveTeacherPublisherProfile(teacherProfile)
      : { publisherName: undefined, publisherAvatar: undefined };

    await appendNotificationToAllUsers(
      buildLibraryNotification(
        itemType,
        itemId,
        resolvedPublisher.publisherName,
        resolvedPublisher.publisherAvatar,
        resourceTitle,
        previewImage,
      ),
      undefined,
    );
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }
};
