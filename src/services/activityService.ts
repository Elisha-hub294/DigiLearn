import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { AppState } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { ActivityItem, ActivityRecord, ActivityType } from "../types/activity";

const MAX_ACTIVITY_ITEMS = 50;
const ACTIVITY_EVENT_BATCH_SIZE = 20;
const ACTIVITY_EVENT_QUEUE_KEY = "@digilearn/activity-event-queue";
const ACTIVITY_FETCH_TIMEOUT_MS = 15000;

const ACTIVITY_FIELD_MAP: Record<ActivityType, string> = {
  lesson: "activity-lessons",
  page: "activity-pages",
  book: "activity-books",
  paper: "activity-pages",
};

type PendingActivityEvent = Omit<ActivityEvent, "id">;

let activityQueueOperation: Promise<unknown> = Promise.resolve();

function withActivityQueueLock<T>(operation: () => Promise<T>): Promise<T> {
  const nextOperation = activityQueueOperation.then(operation, operation);
  activityQueueOperation = nextOperation.catch(() => undefined);
  return nextOperation;
}

function getActivityQueueKey(userId: string): string {
  return `${ACTIVITY_EVENT_QUEUE_KEY}:${userId}`;
}

async function readPendingActivityEvents(
  userId: string,
): Promise<PendingActivityEvent[]> {
  const stored = await AsyncStorage.getItem(getActivityQueueKey(userId));
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function uploadActivityBatch(
  userId: string,
  events: PendingActivityEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const firstEvent = events[0];
  await addDoc(collection(db, "activityEvents"), {
    userId,
    userName: firstEvent.userName,
    userEmail: firstEvent.userEmail,
    events: events.map(({ type, resourceId, openedAt }) => ({
      type,
      resourceId,
      openedAt,
    })),
    createdAt: new Date().toISOString(),
  });
}

async function flushActivityEventsLocked(userId: string): Promise<void> {
  const pendingEvents = await readPendingActivityEvents(userId);
  if (pendingEvents.length === 0) return;

  await uploadActivityBatch(
    userId,
    pendingEvents.slice(0, ACTIVITY_EVENT_BATCH_SIZE),
  );
  const remainingEvents = pendingEvents.slice(ACTIVITY_EVENT_BATCH_SIZE);
  const queueKey = getActivityQueueKey(userId);

  if (remainingEvents.length > 0) {
    await AsyncStorage.setItem(queueKey, JSON.stringify(remainingEvents));
  } else {
    await AsyncStorage.removeItem(queueKey);
  }
}

export function flushActivityEvents(): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return Promise.resolve();
  return withActivityQueueLock(() => flushActivityEventsLocked(userId));
}

AppState.addEventListener("change", (nextState) => {
  if (nextState === "active") void flushActivityEvents();
});

async function queueActivityEvent(event: PendingActivityEvent): Promise<void> {
  return withActivityQueueLock(async () => {
    const queueKey = getActivityQueueKey(event.userId);
    const pendingEvents = await readPendingActivityEvents(event.userId);
    const nextEvents = [...pendingEvents, event];
    await AsyncStorage.setItem(queueKey, JSON.stringify(nextEvents));

    if (nextEvents.length >= ACTIVITY_EVENT_BATCH_SIZE) {
      await flushActivityEventsLocked(event.userId);
    }
  });
}

async function getActivityProfileRef(userId: string) {
  const teacherRef = doc(db, "teachers", userId);
  const teacherSnap = await getDoc(teacherRef);
  return teacherSnap.exists() ? teacherRef : doc(db, "users", userId);
}

/**
 * Formats ISO timestamp or Date string into clean display format:
 * "Today", "Yesterday", "18 July", "12 June 2025"
 */
export function formatActivityDate(dateInput: any): string {
  if (!dateInput) return "Recently";

  let date: Date | null = null;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput > 1e11 ? dateInput : dateInput * 1000);
  } else if (typeof dateInput === "string") {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) date = parsed;
  } else if (typeof dateInput === "object" && dateInput !== null) {
    if (typeof dateInput.toDate === "function") {
      try {
        date = dateInput.toDate();
      } catch {}
    } else if (typeof dateInput.seconds === "number") {
      date = new Date(dateInput.seconds * 1000);
    }
  }

  if (!date || isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }

  return `${day} ${month} ${date.getFullYear()}`;
}

/**
 * Records user activity for lesson, page, or book.
 * Avoids duplicates by updating timestamp & moving opened item to top.
 */
export async function recordUserActivity(
  userId: string | undefined,
  type: ActivityType,
  docId: string,
): Promise<void> {
  if (!userId || !docId || !type) return;

  const fieldName = ACTIVITY_FIELD_MAP[type];
  if (!fieldName) return;

  try {
    const profileRef = await getActivityProfileRef(userId);
    const userSnap = await getDoc(profileRef);

    let currentList: ActivityRecord[] = [];
    if (userSnap.exists()) {
      const data = userSnap.data();
      const rawList = data[fieldName];
      if (Array.isArray(rawList)) {
        currentList = rawList
          .map((item) => {
            if (typeof item === "string") {
              return { id: item, openedAt: new Date().toISOString() };
            }
            return {
              id: String(item.id || ""),
              openedAt: item.openedAt
                ? typeof item.openedAt === "string"
                  ? item.openedAt
                  : new Date(
                      item.openedAt.seconds
                        ? item.openedAt.seconds * 1000
                        : Date.now(),
                    ).toISOString()
                : new Date().toISOString(),
            };
          })
          .filter((item) => Boolean(item.id));
      }
    }

    // Filter out previous occurrences of the exact same document
    const filteredList = currentList.filter((item) => item.id !== docId);

    // Prepend newly opened item
    const updatedList: ActivityRecord[] = [
      { id: docId, openedAt: new Date().toISOString() },
      ...filteredList,
    ].slice(0, MAX_ACTIVITY_ITEMS);

    await setDoc(profileRef, { [fieldName]: updatedList }, { merge: true });

    await queueActivityEvent({
      userId,
      userName: auth.currentUser?.displayName || "DigiLearn user",
      userEmail: auth.currentUser?.email || "",
      type,
      resourceId: docId,
      openedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(
      `Failed to record ${type} activity for user ${userId}:`,
      error,
    );
  }
}

export async function recordPageVisit(pageId: string): Promise<void> {
  if (!pageId) return;

  try {
    const pageRef = doc(db, "pages", pageId);
    await runTransaction(db, async (transaction) => {
      const pageSnapshot = await transaction.get(pageRef);
      const storedVisits = pageSnapshot.exists()
        ? Number(pageSnapshot.data().visits)
        : 0;
      const visits =
        Number.isFinite(storedVisits) && storedVisits >= 0 ? storedVisits : 0;

      transaction.set(pageRef, { visits: visits + 1 }, { merge: true });
    });
  } catch (error) {
    console.warn(`Failed to record page visit for ${pageId}:`, error);
  }
}

export async function recordBookVisit(bookId: string): Promise<void> {
  if (!bookId) return;

  try {
    const bookRef = doc(db, "books", bookId);
    await runTransaction(db, async (transaction) => {
      const bookSnapshot = await transaction.get(bookRef);
      const storedVisits = bookSnapshot.exists()
        ? Number(bookSnapshot.data().visits)
        : 0;
      const visits =
        Number.isFinite(storedVisits) && storedVisits >= 0 ? storedVisits : 0;

      transaction.set(bookRef, { visits: visits + 1 }, { merge: true });
    });
  } catch (error) {
    console.warn(`Failed to record book visit for ${bookId}:`, error);
  }
}

export async function recordLessonVisit(lessonId: string): Promise<void> {
  if (!lessonId) return;

  try {
    const lessonRef = doc(db, "trendingLessons", lessonId);
    await runTransaction(db, async (transaction) => {
      const lessonSnapshot = await transaction.get(lessonRef);
      const storedVisits = lessonSnapshot.exists()
        ? Number(lessonSnapshot.data().visits)
        : 0;
      const visits =
        Number.isFinite(storedVisits) && storedVisits >= 0 ? storedVisits : 0;

      transaction.set(lessonRef, { visits: visits + 1 }, { merge: true });
    });
  } catch (error) {
    console.warn(`Failed to record lesson visit for ${lessonId}:`, error);
  }
}

export type ActivityEvent = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: ActivityType;
  resourceId: string;
  resourceTitle?: string;
  openedAt: string;
};

export async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  const snapshot = await getDocs(collection(db, "activityEvents"));
  return snapshot.docs
    .flatMap((item) => {
      const data = item.data();
      if (Array.isArray(data.events)) {
        return data.events.map(
          (event, index) =>
            ({
              id: `${item.id}-${index}`,
              userId: String(data.userId || ""),
              userName: String(data.userName || "DigiLearn user"),
              userEmail: String(data.userEmail || ""),
              type: event.type,
              resourceId: String(event.resourceId || ""),
              openedAt: event.openedAt,
            }) as ActivityEvent,
        );
      }

      return [{ id: item.id, ...data } as ActivityEvent];
    })
    .filter(
      (item) => item.userId && item.type && item.resourceId && item.openedAt,
    )
    .sort(
      (first, second) =>
        new Date(second.openedAt).getTime() -
        new Date(first.openedAt).getTime(),
    );
}

/**
 * Fetches all user activity records and referenced database documents.
 */
export async function fetchUserActivity(
  userId: string,
): Promise<ActivityItem[]> {
  if (!userId) return [];

  try {
    const fetchActivity = async (): Promise<ActivityItem[]> => {
      const profileRef = await getActivityProfileRef(userId);
      const userSnap = await getDoc(profileRef);

      if (!userSnap.exists()) return [];

      const userData = userSnap.data();
      const lessonsRaw: any[] = Array.isArray(userData["activity-lessons"])
        ? userData["activity-lessons"]
        : [];
      const pagesRaw: any[] = Array.isArray(userData["activity-pages"])
        ? userData["activity-pages"]
        : [];
      const booksRaw: any[] = Array.isArray(userData["activity-books"])
        ? userData["activity-books"]
        : [];

      const normalizeRecords = (rawList: any[]): ActivityRecord[] => {
        return rawList
          .map((item) => {
            if (typeof item === "string") {
              return { id: item, openedAt: new Date().toISOString() };
            }
            if (item && typeof item === "object" && item.id) {
              let openedAtStr = new Date().toISOString();
              if (typeof item.openedAt === "string") {
                openedAtStr = item.openedAt;
              } else if (
                item.openedAt &&
                typeof item.openedAt.seconds === "number"
              ) {
                openedAtStr = new Date(
                  item.openedAt.seconds * 1000,
                ).toISOString();
              }
              return { id: String(item.id), openedAt: openedAtStr };
            }
            return null;
          })
          .filter((item): item is ActivityRecord => item !== null);
      };

      const lessonRecords = normalizeRecords(lessonsRaw);
      const pageRecords = normalizeRecords(pagesRaw);
      const bookRecords = normalizeRecords(booksRaw);

      const activityItems: ActivityItem[] = [];

      // 1. Fetch Lessons
      await Promise.all(
        lessonRecords.map(async (record) => {
          try {
            const lessonSnap = await getDoc(
              doc(db, "trendingLessons", record.id),
            );
            if (lessonSnap.exists()) {
              const data = lessonSnap.data();
              const title = data.title || data.name || "Untitled lesson";
              const teacher = data.teacher ? `Teacher: ${data.teacher}` : "";
              const subject = data.subject || "General";
              const description =
                data.description ||
                (teacher ? `${teacher} • ${subject}` : subject);

              activityItems.push({
                id: `lesson-${record.id}-${record.openedAt}`,
                targetId: record.id,
                type: "lesson",
                title,
                description,
                openedAt: record.openedAt,
                rawDoc: { id: lessonSnap.id, ...data },
              });
            }
          } catch (e) {
            console.warn(`Could not fetch lesson doc ${record.id}:`, e);
          }
        }),
      );

      // 2. Fetch Pages / Past Papers / Teacher Notes
      await Promise.all(
        pageRecords.map(async (record) => {
          try {
            let pageSnap = await getDoc(doc(db, "pages", record.id));
            let data: any = null;

            if (pageSnap.exists()) {
              data = pageSnap.data();
            } else {
              // Try pastPaper collection
              const paperSnap = await getDoc(doc(db, "pastPaper", record.id));
              if (paperSnap.exists()) {
                data = paperSnap.data();
              }
            }

            if (data) {
              const title = data.title || data.name || "Untitled note";
              const subject = data.subject ? `Subject: ${data.subject}` : "";
              const typeLabel = data.type || data.examType || "Study Note";
              const description =
                data.description ||
                data.subtitle ||
                (subject ? `${typeLabel} • ${subject}` : typeLabel);

              activityItems.push({
                id: `page-${record.id}-${record.openedAt}`,
                targetId: record.id,
                type: "page",
                title,
                description,
                openedAt: record.openedAt,
                rawDoc: { id: record.id, ...data },
              });
            }
          } catch (e) {
            console.warn(`Could not fetch page doc ${record.id}:`, e);
          }
        }),
      );

      // 3. Fetch Books
      await Promise.all(
        bookRecords.map(async (record) => {
          try {
            const bookSnap = await getDoc(doc(db, "books", record.id));
            if (bookSnap.exists()) {
              const data = bookSnap.data();
              const title =
                data.title || data.name || data.bookTitle || "Untitled book";
              const author =
                data.author || data.writer
                  ? `By ${data.author || data.writer}`
                  : "";
              const description =
                data.description ||
                data.subtitle ||
                data.summary ||
                author ||
                "Academic Book";

              activityItems.push({
                id: `book-${record.id}-${record.openedAt}`,
                targetId: record.id,
                type: "book",
                title,
                description,
                openedAt: record.openedAt,
                rawDoc: { id: bookSnap.id, ...data },
              });
            }
          } catch (e) {
            console.warn(`Could not fetch book doc ${record.id}:`, e);
          }
        }),
      );

      // Sort chronologically (openedAt DESC)
      activityItems.sort((a, b) => {
        const timeA = new Date(a.openedAt).getTime() || 0;
        const timeB = new Date(b.openedAt).getTime() || 0;
        return timeB - timeA;
      });

      return activityItems;
    };

    return await Promise.race([
      fetchActivity(),
      new Promise<ActivityItem[]>((_, reject) => {
        setTimeout(
          () => reject(new Error("Activity request timed out.")),
          ACTIVITY_FETCH_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw error;
  }
}
