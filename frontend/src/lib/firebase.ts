import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// These values come from .env.local. They identify your Firebase project; they are not secrets.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
  return getAuth(getFirebaseApp());
}
export function getFirestoreDb(): Firestore {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
  return getFirestore(getFirebaseApp());
}