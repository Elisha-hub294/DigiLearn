import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActionCodeSettings,
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
    // During local web development, callback on the same origin so Firebase
    // Auth persistence is shared with the tab where sign-up began.
    return `${window.location.origin}/finishSignIn`;
  }

  return "https://digilearn-af86d.web.app/finishSignIn";
}

const actionCodeSettings: ActionCodeSettings = {
  // Keep the callback on the same Hosting origin as the web app. Firebase
  // Auth persistence is scoped to an origin, so using firebaseapp.com here
  // while users sign up on web.app leaves the original tab unsigned in.
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

  const email = emailOverride?.trim().toLowerCase() || (await getPendingEmailAddress());
  if (!email) {
    throw new Error("EMAIL_LINK_ADDRESS_MISSING");
  }

  const credential = await signInWithEmailLink(auth, email, url);
  await AsyncStorage.removeItem(EMAIL_LINK_ADDRESS_KEY);
  return credential.user;
}
