import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCKAYN1h2binUbKcJAZhcXZL8KQ_rBs21I",
  authDomain: "digilearn-af86d.firebaseapp.com",
  projectId: "digilearn-af86d",
  storageBucket: "digilearn-af86d.firebasestorage.app",
  messagingSenderId: "851245099108",
  appId: "1:851245099108:web:fab0d172231b2a550a9771",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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

