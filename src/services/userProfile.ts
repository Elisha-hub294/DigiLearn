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
  { accountTypeCompleted: boolean; type: AccountType }
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
  "saved-pages": [],
  "saved-books": [],
  "saved-lessons": [],
  "saved-posts": [],
});

export async function getUserOnboardingState(userId: string) {
  if (onboardingStateCache[userId]) {
    return onboardingStateCache[userId];
  }

  const ref = doc(db, "users", userId);
  const snapshot = await getDoc(ref);
  const data = snapshot.data();
  const result = {
    exists: snapshot.exists(),
    accountTypeCompleted: Boolean(data?.accountTypeCompleted === true),
    type: (data?.type as AccountType | undefined) ?? "",
  };

  onboardingStateCache[userId] = {
    accountTypeCompleted: result.accountTypeCompleted,
    type: result.type,
  };

  return result;
}

export async function saveAccountTypeDecision(
  user: User,
  accountType: AccountType,
) {
  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      type: accountType,
      accountTypeCompleted: true,
    },
    { merge: true },
  );

  onboardingStateCache[user.uid] = {
    accountTypeCompleted: true,
    type: accountType,
  };
}

/** Creates only missing fields, preserving all profile edits and the original join date. */
export async function ensureUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const fallback = defaultUserProfile(user);

  if (!snapshot.exists()) {
    await setDoc(ref, { ...fallback, joinedAt: serverTimestamp() });
    return;
  }

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
