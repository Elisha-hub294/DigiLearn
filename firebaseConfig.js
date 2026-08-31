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
const webFirebaseConfig = Constants.expoConfig?.web?.config?.firebase ?? {};

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    extra.firebaseApiKey ||
    webFirebaseConfig.apiKey ||
    "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    extra.firebaseAuthDomain ||
    webFirebaseConfig.authDomain ||
    "",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    extra.firebaseProjectId ||
    webFirebaseConfig.projectId ||
    "",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    extra.firebaseStorageBucket ||
    webFirebaseConfig.storageBucket ||
    "",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    extra.firebaseMessagingSenderId ||
    webFirebaseConfig.messagingSenderId ||
    "",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    extra.firebaseAppId ||
    webFirebaseConfig.appId ||
    "",
};

const firebaseApiKeyLooksValid =
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.startsWith("AIza");

if (
  !firebaseApiKeyLooksValid ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  const message =
    "Firebase is not configured correctly. Set the EXPO_PUBLIC_FIREBASE_* values in .env or app config to match your Firebase project; an invalid or blank API key will trigger auth/invalid-api-key.";

  console.error(message);
  throw new Error(message);
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
