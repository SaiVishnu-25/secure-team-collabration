/**
 * Firebase Configuration
 * 
 * Initialize Firebase services for Storage and Firestore
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// Replace these with your actual Firebase config values
// Get from: Firebase Console > Project Settings > General > Your apps
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

export function initFirebase(): {
  app: FirebaseApp;
  storage: FirebaseStorage;
  firestore: Firestore;
  auth: Auth;
} {
  if (!app) {
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    firestore = getFirestore(app);
    auth = getAuth(app);
  }

  return {
    app: app!,
    storage: storage!,
    firestore: firestore!,
    auth: auth!,
  };
}

// Initialize on import
export const { app: firebaseApp, storage: firebaseStorage, firestore: firebaseFirestore, auth: firebaseAuth } = initFirebase();

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const w = window as Record<string, unknown>;
  w.firebaseAuth = firebaseAuth;
  w.firebaseFirestore = firebaseFirestore;
  w.firebaseApp = firebaseApp;
}

