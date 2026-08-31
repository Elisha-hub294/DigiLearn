import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey || "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    extra.firebaseAuthDomain ||
    "",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    extra.firebaseProjectId ||
    "",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    extra.firebaseStorageBucket ||
    "",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    extra.firebaseMessagingSenderId ||
    "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId || "",
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  console.warn(
    "Firebase config is missing. Set EXPO_PUBLIC_FIREBASE_* values in your local environment or app.config.ts extra values.",
  );
}

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

let firebaseAuth;
if (Platform.OS === "web") {
  firebaseAuth = getAuth(app);
} else {
  try {
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_e) {
    firebaseAuth = getAuth(app);
  }
}

export const auth = firebaseAuth;
