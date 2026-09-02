import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../../../../firebaseConfig";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../../../services/notifications";
import { getTitleDocId } from "./utils";

export interface UploadProgressCallback {
  (label: string, progress: number): void;
}

/**
 * Uploads an asset to Firebase Storage with progress tracking
 */
export const uploadAssetToStorage = async (
  path: string,
  blob: Blob,
  label: string,
  onProgress: UploadProgressCallback,
  metadata?: { contentType?: string },
): Promise<string> => {
  const storageRef = ref(storage, path);

  return new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, metadata);

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
        reject(error);
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
    ordinaryPapers?: number;
    advancedPapers?: number;
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

        return {
          id: doc.id,
          name: (data.name as string) || "",
          ordinary: (data.ordinary as string) || "",
          advanced: (data.advanced as string) || "",
          ordinaryPapers,
          advancedPapers,
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
    updatedAt: serverTimestamp(),
  });

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
) => {
  const bannerId = `${getTitleDocId(title)}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  await setDoc(doc(db, "teacherPosts", bannerId), {
    title,
    descriprion: description,
    hasCover,
    cover: coverUrl,
    document: documentUrl,
    createdAt: serverTimestamp(),
    subject: subject || "General",
    owner: userId,
    ownerType: userType || "",
    fileType,
  });

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
) => {
  const itemId = getTitleDocId(title);

  await setDoc(doc(db, "pages", itemId), {
    book: books,
    cover: coverUrl,
    description: description || "",
    document: documentUrl,
    level: level || "",
    subject: subject || "General",
    title,
    updatedAt: serverTimestamp(),
    ...(schoolClass ? { schoolClass } : {}),
  });

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
    ...(hasPaperSuffix && savedPaperCode
      ? { paperNumber: savedPaperNumber }
      : {}),
    type: type || "UNEB",
    level: level || "",
    year: year || String(new Date().getFullYear()),
    paperCode: savedPaperCode || "",
    updatedAt: serverTimestamp(),
  });

  return itemId;
};

/**
 * Sends notifications to all users about a new library item
 */
export const notifyUsersAboutNewItem = async (
  itemType: "book" | "page" | "lesson" | "announcement" | "paper",
  itemId: string,
  resourceTitle?: string,
) => {
  try {
    await appendNotificationToAllUsers(
      buildLibraryNotification(
        itemType,
        itemId,
        undefined,
        undefined,
        resourceTitle,
      ),
    );
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }
};
