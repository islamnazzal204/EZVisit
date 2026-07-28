// ============================================================
// EZVisit — Firebase Configuration & Auth Helpers
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBFd3dJXaSFU4AJLlCz0O8grBv6UenjnJ8',
  authDomain: 'ezvisit-e99b6.firebaseapp.com',
  projectId: 'ezvisit-e99b6',
  storageBucket: 'ezvisit-e99b6.firebasestorage.app',
  appId: 'ezvisit-e99b6', // minimal — not required for auth
};

// Initialize Firebase (singleton)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// --- Auth helpers ---

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export type { User };
