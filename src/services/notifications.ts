import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export type NotificationType =
  | "book"
  | "lesson"
  | "page"
  | "announcement"
  | "paper";

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  publisherName: string;
  publisherAvatar: string;
  message: string;
  resourceTitle?: string;
  createdAt: unknown;
  read: boolean;
  itemId?: string;
  collection?: string;
  navigation?: string;
  storage?: "admin";
};

export const DIGILEARN_PUBLISHER_NAME = "DigiLearn";
export const DIGILEARN_PUBLISHER_AVATAR = "@/assets/images/panda.png";

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; color: string; icon: string; background: string }
> = {
  book: {
    label: "Books",
    color: "#FF626A",
    icon: "book-open",
    background: "#FF626A",
  },
  lesson: {
    label: "Lessons",
    color: "#9758B8",
    icon: "play",
    background: "#9758B8",
  },
  page: {
    label: "Pages",
    color: "#3F82F4",
    icon: "file-text",
    background: "#3F82F4",
  },
  paper: {
    label: "Past Papers",
    color: "#F59E0B",
    icon: "file-document-outline",
    background: "#F59E0B",
  },
  announcement: {
    label: "Announcements",
    color: "#4B5563",
    icon: "megaphone",
    background: "#4B5563",
  },
};

const NOTIFICATION_ASSET_MAP: Record<string, any> = {
  "@/assets/images/panda.png": require("../../assets/images/panda.png"),
};

export function normalizeNotification(raw: unknown): NotificationRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const type = candidate.type;
  const validType =
    type === "book" ||
    type === "lesson" ||
    type === "page" ||
    type === "paper" ||
    type === "announcement";

  if (!validType) {
    return null;
  }

  const id =
    typeof candidate.id === "string" && candidate.id.trim()
      ? candidate.id
      : `${Date.now()}-${Math.random()}`;

  const notification: NotificationRecord = {
    id,
    type,
    publisherName:
      typeof candidate.publisherName === "string" &&
      candidate.publisherName.trim()
        ? candidate.publisherName
        : DIGILEARN_PUBLISHER_NAME,
    publisherAvatar:
      typeof candidate.publisherAvatar === "string" &&
      candidate.publisherAvatar.trim()
        ? candidate.publisherAvatar
        : DIGILEARN_PUBLISHER_AVATAR,
    message:
      typeof candidate.message === "string" && candidate.message.trim()
        ? candidate.message
        : "New update available",
    createdAt: candidate.createdAt ?? Timestamp.now(),
    read: Boolean(candidate.read),
  };

  if (candidate.storage === "admin") {
    notification.storage = "admin";
  }

  const resourceTitle =
    typeof candidate.resourceTitle === "string" &&
    candidate.resourceTitle.trim()
      ? candidate.resourceTitle
      : undefined;
  const itemId =
    typeof candidate.itemId === "string" ? candidate.itemId : undefined;
  const collection =
    typeof candidate.collection === "string" ? candidate.collection : undefined;
  const navigation =
    typeof candidate.navigation === "string" ? candidate.navigation : undefined;

  if (resourceTitle) notification.resourceTitle = resourceTitle;
  if (itemId) notification.itemId = itemId;
  if (collection) notification.collection = collection;
  if (navigation) notification.navigation = navigation;

  return stripUndefinedFields(notification) as NotificationRecord;
}

export function resolveNotificationAvatarSource(avatar?: string) {
  if (!avatar) {
    return NOTIFICATION_ASSET_MAP["@/assets/images/panda.png"];
  }

  if (avatar.startsWith("http") || avatar.startsWith("data:")) {
    return { uri: avatar };
  }

  if (avatar.startsWith("@/assets/")) {
    return (
      NOTIFICATION_ASSET_MAP[avatar] ??
      NOTIFICATION_ASSET_MAP["@/assets/images/panda.png"]
    );
  }

  return { uri: avatar };
}

export function getNotificationAgeInMs(createdAt: unknown): number | null {
  if (!createdAt) {
    return null;
  }

  if (typeof createdAt === "number") {
    return createdAt;
  }

  if (typeof createdAt === "string") {
    const parsed = Date.parse(createdAt);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof createdAt === "object") {
    if (
      "toDate" in createdAt &&
      typeof (createdAt as { toDate?: () => Date }).toDate === "function"
    ) {
      const date = (createdAt as { toDate: () => Date }).toDate();
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    if (
      "seconds" in createdAt &&
      typeof (createdAt as { seconds?: number }).seconds === "number"
    ) {
      return (createdAt as { seconds: number }).seconds * 1000;
    }
  }

  return null;
}

export function formatRelativeNotificationTime(createdAt: unknown): string {
  const age = getNotificationAgeInMs(createdAt);
  if (age === null) {
    return "Just now";
  }

  const diffMs = Date.now() - age;
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) {
    const date = new Date(age);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  }

  const date = new Date(age);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sortNotificationsNewestFirst(notifications: NotificationRecord[]) {
  return [...notifications].sort((a, b) => {
    const aMs = getNotificationAgeInMs(a.createdAt);
    const bMs = getNotificationAgeInMs(b.createdAt);

    if (aMs === null && bMs === null) return 0;
    if (aMs === null) return 1;
    if (bMs === null) return -1;

    return bMs - aMs;
  });
}

export function getNotificationSections(notifications: NotificationRecord[]) {
  const now = Date.now();
  const unread: NotificationRecord[] = [];
  const read: NotificationRecord[] = [];
  const earlier: NotificationRecord[] = [];

  notifications.forEach((notification) => {
    const createdAtMs = getNotificationAgeInMs(notification.createdAt);
    if (createdAtMs === null) {
      earlier.push(notification);
      return;
    }

    const ageInDays = (now - createdAtMs) / (1000 * 60 * 60 * 24);
    if (ageInDays > 7) {
      earlier.push(notification);
    } else if (!notification.read) {
      unread.push(notification);
    } else if (ageInDays <= 4) {
      read.push(notification);
    } else {
      earlier.push(notification);
    }
  });

  return {
    unread: sortNotificationsNewestFirst(unread),
    read: sortNotificationsNewestFirst(read),
    earlier: sortNotificationsNewestFirst(earlier),
  };
}

function stripUndefinedFields<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedFields(item))
      .filter((item) => item !== undefined) as T;
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce(
      (cleaned, [key, nestedValue]) => {
        if (nestedValue === undefined) {
          return cleaned;
        }

        cleaned[key] = stripUndefinedFields(nestedValue);
        return cleaned;
      },
      {} as Record<string, unknown>,
    ) as T;
  }

  return value;
}

function sanitizeNotificationRecord(notification: NotificationRecord) {
  return stripUndefinedFields({
    ...notification,
    createdAt: notification.createdAt ?? Timestamp.now(),
  }) as NotificationRecord;
}

export async function appendNotificationForUser(
  userId: string,
  notification: NotificationRecord,
) {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const current = Array.isArray(snapshot.data()?.notifications)
    ? (snapshot.data()?.notifications ?? [])
    : [];

  const nextNotification = sanitizeNotificationRecord(notification);

  await setDoc(
    userRef,
    {
      notifications: [...current, nextNotification],
    },
    { merge: true },
  );
}

export async function appendNotificationToAllUsers(
  notification: NotificationRecord,
) {
  const usersSnap = await getDocs(collection(db, "users"));

  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const data = userDoc.data() as { notifications?: NotificationRecord[] };
      const current = Array.isArray(data.notifications)
        ? data.notifications
        : [];

      await updateDoc(userDoc.ref, {
        notifications: [...current, sanitizeNotificationRecord(notification)],
      });
    }),
  );
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  if (!userId) return false;

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const current = Array.isArray(snapshot.data()?.notifications)
    ? (snapshot.data()?.notifications as NotificationRecord[])
    : [];

  const updated = current.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );

  await setDoc(
    userRef,
    { notifications: updated.map((item) => sanitizeNotificationRecord(item)) },
    { merge: true },
  );
  return true;
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
) {
  if (!userId) return false;

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const current = Array.isArray(snapshot.data()?.notifications)
    ? (snapshot.data()?.notifications as NotificationRecord[])
    : [];

  const updated = current.filter((item) => item.id !== notificationId);

  await setDoc(userRef, { notifications: updated }, { merge: true });
  return true;
}

export const libraryNotificationMap: Record<
  "book" | "page" | "announcement" | "lesson" | "paper",
  { message: string; collection: string; navigation: string }
> = {
  book: {
    message: "Published a new book",
    collection: "books",
    navigation: "/book-preview",
  },
  page: {
    message: "Published a new page",
    collection: "pages",
    navigation: "/page-preview",
  },
  paper: {
    message: "Added a new past paper",
    collection: "pastPaper",
    navigation: "/pdf-reader",
  },
  announcement: {
    message: "New announcement",
    collection: "teacherPosts",
    navigation: "/teacher-profile",
  },
  lesson: {
    message: "Started a new course",
    collection: "trendingLessons",
    navigation: "/lesson-player",
  },
};

export function buildLibraryNotification(
  type: NotificationType,
  itemId: string,
  publisherName = DIGILEARN_PUBLISHER_NAME,
  publisherAvatar = DIGILEARN_PUBLISHER_AVATAR,
  resourceTitle?: string,
): NotificationRecord {
  const details = libraryNotificationMap[type];
  const notification: NotificationRecord = {
    id: `${type}-${itemId}-${Date.now()}`,
    type,
    publisherName,
    publisherAvatar,
    message: details.message,
    createdAt: Timestamp.now(),
    read: false,
  };

  const trimmedTitle = resourceTitle?.trim();
  if (trimmedTitle) {
    notification.resourceTitle = trimmedTitle;
  }
  if (itemId) {
    notification.itemId = itemId;
  }
  if (details.collection) {
    notification.collection = details.collection;
  }
  if (details.navigation) {
    notification.navigation = details.navigation;
  }

  return stripUndefinedFields(notification) as NotificationRecord;
}
