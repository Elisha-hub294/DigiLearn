import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKAYN1h2binUbKcJAZhcXZL8KQ_rBs21I",
  authDomain: "digilearn-af86d.firebaseapp.com",
  projectId: "digilearn-af86d",
  storageBucket: "digilearn-af86d.firebasestorage.app",
  messagingSenderId: "851245099108",
  appId: "1:851245099108:web:fab0d172231b2a550a9771",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
