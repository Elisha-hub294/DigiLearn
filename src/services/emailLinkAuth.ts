import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActionCodeSettings,
  deleteUser,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";
import { Platform } from "react-native";

import { auth } from "../../firebaseConfig";

const EMAIL_LINK_ADDRESS_KEY = "email_link_signup_address";

export function getEmailLinkContinueUrl() {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return `${window.location.origin}/finishSignIn`;
  }

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location?.origin
  ) {
    return `${window.location.origin}/finishSignIn`;
  }

  const authDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "digilearn-af86d.firebaseapp.com";

  return `https://${authDomain}/finishSignIn`;
}

export function getActionCodeSettings(): ActionCodeSettings {
  return {
    url: getEmailLinkContinueUrl(),
    handleCodeInApp: true,
    iOS: { bundleId: "com.digilearn.app" },
    android: {
      // This must match `expo.android.package` and google-services.json. If it
      // differs, Firebase completes the link in the browser instead of returning
      // to the installed Android app.
      packageName: "com.osplatform.app",
      installApp: true,
      minimumVersion: "1",
    },
  };
}

export const actionCodeSettings: ActionCodeSettings = getActionCodeSettings();

export async function sendEmailLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await sendSignInLinkToEmail(auth, normalizedEmail, getActionCodeSettings());
  await AsyncStorage.setItem(EMAIL_LINK_ADDRESS_KEY, normalizedEmail);
}

export async function getPendingEmailAddress() {
  return AsyncStorage.getItem(EMAIL_LINK_ADDRESS_KEY);
}

export async function completeEmailLink(url: string, emailOverride?: string) {
  if (!isSignInWithEmailLink(auth, url)) return null;

  let email = emailOverride?.trim().toLowerCase();
  if (!email) {
    try {
      const parsed = new URL(url, "https://digilearn-af86d.firebaseapp.com");
      const paramEmail =
        parsed.searchParams.get("email") ||
        parsed.searchParams.get("userEmail");
      if (paramEmail) {
        email = paramEmail.trim().toLowerCase();
      }
    } catch {
      // Ignore URL parse failure
    }
  }

  if (!email) {
    email = (await getPendingEmailAddress()) || undefined;
  }

  if (!email) {
    throw new Error("EMAIL_LINK_ADDRESS_MISSING");
  }

  const credential = await signInWithEmailLink(auth, email, url);
  if (!credential.user.emailVerified) {
    await deleteUser(credential.user);
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  await AsyncStorage.removeItem(EMAIL_LINK_ADDRESS_KEY);
  return credential.user;
}

