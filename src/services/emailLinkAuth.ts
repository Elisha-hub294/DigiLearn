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

function getEmailLinkContinueUrl() {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return `${window.location.origin}/finishSignIn`;
  }

  return "https://digilearn-af86d.web.app/finishSignIn";
}

const actionCodeSettings: ActionCodeSettings = {
  url: getEmailLinkContinueUrl(),
  handleCodeInApp: true,
  iOS: { bundleId: "com.digilearn.app" },
  android: {
    packageName: "com.digilearn.app",
    installApp: true,
    minimumVersion: "1",
  },
};

export async function sendEmailLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
  await AsyncStorage.setItem(EMAIL_LINK_ADDRESS_KEY, normalizedEmail);
}

export async function getPendingEmailAddress() {
  return AsyncStorage.getItem(EMAIL_LINK_ADDRESS_KEY);
}

export async function completeEmailLink(url: string, emailOverride?: string) {
  if (!isSignInWithEmailLink(auth, url)) return null;

  const email =
    emailOverride?.trim().toLowerCase() || (await getPendingEmailAddress());
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
