import { User } from "firebase/auth";
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export type AccountType = "student" | "teacher" | "";

export type HiddenPageRecord = {
  id: string;
  hiddenAt?: unknown;
};

export type UserProfile = {
  name: string;
  email: string;
  photoURL: string;
  bio: string;
  level: string;
  school: string;
  gender: string;
  subjects: string[];
  joinedAt?: unknown;
  accountTypeCompleted?: boolean;
  type?: AccountType;
  "marked-as-read": string[];
  "hidden-pages": HiddenPageRecord[];
  "saved-pages": string[];
  "saved-books": string[];
  "saved-lessons": string[];
  "saved-posts": string[];
};

export type SavedItemType =
  | "saved-pages"
  | "saved-books"
  | "saved-lessons"
  | "saved-posts";

const onboardingStateCache: Record<
  string,
  { exists: boolean; accountTypeCompleted: boolean; type: AccountType }
> = {};

export async function toggleSavedItem(
  userId: string,
  itemType: SavedItemType,
  itemId: string,
  isCurrentlySaved: boolean,
) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      [itemType]: isCurrentlySaved ? arrayRemove(itemId) : arrayUnion(itemId),
    },
    { merge: true },
  );
}

export async function togglePageReadState(
  userId: string,
  itemId: string,
  isRead: boolean,
) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const currentRead = Array.isArray(snapshot.data()?.["marked-as-read"])
    ? (snapshot.data()?.["marked-as-read"] as string[])
    : [];

  const nextRead = isRead
    ? currentRead.filter((entry) => entry !== itemId)
    : [...new Set([...currentRead, itemId])];

  await setDoc(userRef, { "marked-as-read": nextRead }, { merge: true });
}

export async function setPageHiddenState(
  userId: string,
  itemId: string,
  shouldHide: boolean,
) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const currentHidden = Array.isArray(snapshot.data()?.["hidden-pages"])
    ? (snapshot.data()?.["hidden-pages"] as HiddenPageRecord[])
    : [];

  if (shouldHide) {
    const alreadyHidden = currentHidden.some(
      (entry) =>
        typeof entry === "object" && entry !== null && entry.id === itemId,
    );
    if (alreadyHidden) return;

    const nextHidden = [
      ...currentHidden,
      { id: itemId, hiddenAt: serverTimestamp() },
    ];
    await setDoc(userRef, { "hidden-pages": nextHidden }, { merge: true });
    return;
  }

  const nextHidden = currentHidden.filter(
    (entry) =>
      !(typeof entry === "object" && entry !== null && entry.id === itemId),
  );
  await setDoc(userRef, { "hidden-pages": nextHidden }, { merge: true });
}

export const nameFromEmail = (email?: string | null) => {
  const localPart = (email ?? "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return localPart
    ? localPart.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "DigiLearn learner";
};

export const defaultUserProfile = (user: User): UserProfile => ({
  name: user.displayName?.trim() || nameFromEmail(user.email),
  email: user.email ?? "",
  photoURL: user.photoURL ?? "",
  bio: "",
  level: "",
  school: "",
  gender: "",
  subjects: [],
  accountTypeCompleted: false,
  type: "",
  "marked-as-read": [],
  "hidden-pages": [],
  "saved-pages": [],
  "saved-books": [],
  "saved-lessons": [],
  "saved-posts": [],
});

export const getHiddenPageEntries = (
  profile: UserProfile | null | undefined,
): HiddenPageRecord[] => {
  const hiddenPages = profile?.["hidden-pages"] ?? [];
  return Array.isArray(hiddenPages)
    ? hiddenPages.filter(
        (entry): entry is HiddenPageRecord =>
          typeof entry === "object" &&
          entry !== null &&
          typeof entry.id === "string",
      )
    : [];
};

export const getMarkedReadItemIds = (
  profile: UserProfile | null | undefined,
): string[] => {
  const marked = profile?.["marked-as-read"] ?? [];
  return Array.isArray(marked)
    ? marked.filter((entry): entry is string => typeof entry === "string")
    : [];
};

export async function toggleHiddenPage(
  userId: string,
  itemId: string,
  isHidden: boolean,
) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  const currentHidden = Array.isArray(snapshot.data()?.["hidden-pages"])
    ? (snapshot.data()?.["hidden-pages"] as HiddenPageRecord[])
    : [];

  if (isHidden) {
    const nextEntries = currentHidden.filter(
      (entry) =>
        !(typeof entry === "object" && entry !== null && entry.id === itemId),
    );
    await setDoc(userRef, { "hidden-pages": nextEntries }, { merge: true });
    return;
  }

  const exists = currentHidden.some(
    (entry) =>
      typeof entry === "object" && entry !== null && entry.id === itemId,
  );
  if (exists) {
    return;
  }

  await setDoc(
    userRef,
    {
      "hidden-pages": [
        ...currentHidden,
        { id: itemId, hiddenAt: serverTimestamp() },
      ],
    },
    { merge: true },
  );
}

export async function getUserOnboardingState(userId: string) {
  if (onboardingStateCache[userId]) {
    return onboardingStateCache[userId];
  }

  const [teacherSnapshot, userSnapshot] = await Promise.all([
    getDoc(doc(db, "teachers", userId)),
    getDoc(doc(db, "users", userId)),
  ]);
  const snapshot = teacherSnapshot.exists() ? teacherSnapshot : userSnapshot;
  const data = snapshot.data();
  const result = {
    exists: snapshot.exists(),
    accountTypeCompleted: Boolean(data?.accountTypeCompleted === true),
    type: (data?.type as AccountType | undefined) ?? "",
  };

  onboardingStateCache[userId] = {
    exists: result.exists,
    accountTypeCompleted: result.accountTypeCompleted,
    type: result.type,
  };

  return result;
}

export async function saveAccountTypeDecision(
  user: User,
  accountType: AccountType,
) {
  const collectionName = accountType === "teacher" ? "teachers" : "users";
  const ref = doc(db, collectionName, user.uid);
  const snapshot = await getDoc(ref);

  await setDoc(
    ref,
    {
      ...(snapshot.exists() ? {} : defaultUserProfile(user)),
      ...(snapshot.exists() ? {} : { joinedAt: serverTimestamp() }),
      type: accountType,
      accountTypeCompleted: true,
    },
    { merge: true },
  );

  onboardingStateCache[user.uid] = {
    exists: true,
    accountTypeCompleted: true,
    type: accountType,
  };
}

/** Creates only missing fields, preserving all profile edits and the original join date. */
export async function ensureUserProfile(user: User) {
  const onboarding = await getUserOnboardingState(user.uid);
  if (!onboarding.exists) return;

  const collectionName = onboarding.type === "teacher" ? "teachers" : "users";
  const ref = doc(db, collectionName, user.uid);
  const snapshot = await getDoc(ref);
  const fallback = defaultUserProfile(user);

  if (!snapshot.exists()) return;

  const current = snapshot.data();
  const missing: Record<string, unknown> = {};
  if (!current.joinedAt) missing.joinedAt = serverTimestamp();
  if (!current.email && fallback.email) missing.email = fallback.email;
  if (!current.name && fallback.name) missing.name = fallback.name;
  if (!current.photoURL && fallback.photoURL)
    missing.photoURL = fallback.photoURL;
  [
    "bio",
    "level",
    "school",
    "gender",
    "subjects",
    "marked-as-read",
    "hidden-pages",
    "saved-pages",
    "saved-books",
    "saved-lessons",
    "saved-posts",
  ].forEach((key) => {
    if (current[key] === undefined)
      missing[key] = fallback[key as keyof UserProfile];
  });
  if (Object.keys(missing).length) await setDoc(ref, missing, { merge: true });
}
