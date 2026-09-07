import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActionCodeSettings,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";

import { auth } from "../../firebaseConfig";

const EMAIL_LINK_ADDRESS_KEY = "email_link_signup_address";

const actionCodeSettings: ActionCodeSettings = {
  url: "https://digilearn-af86d.firebaseapp.com/finishSignIn",
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

export async function completeEmailLink(url: string) {
  if (!isSignInWithEmailLink(auth, url)) return null;

  const email = await getPendingEmailAddress();
  if (!email) {
    throw new Error("EMAIL_LINK_ADDRESS_MISSING");
  }

  const credential = await signInWithEmailLink(auth, email, url);
  await AsyncStorage.removeItem(EMAIL_LINK_ADDRESS_KEY);
  return credential.user;
}
