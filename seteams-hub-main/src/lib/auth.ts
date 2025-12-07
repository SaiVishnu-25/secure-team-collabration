import { firebaseAuth } from './firebase-config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'firebase/auth';

export function getAllowedDomains(): string[] {
  const raw = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || 'gmail.com,yahoo.com';
  return raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
}

export function isDomainAllowed(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const allowed = getAllowedDomains();
  return allowed.includes(domain);
}

export async function loginWithEmail(email: string, password: string) {
  if (!isDomainAllowed(email)) {
    throw new Error('Email domain not allowed');
  }
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signupWithEmail(email: string, password: string) {
  if (!isDomainAllowed(email)) {
    throw new Error('Email domain not allowed');
  }
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth, email);
}

export async function logout() {
  return signOut(firebaseAuth);
}

export function waitForAuth(): Promise<ReturnType<typeof firebaseAuth['currentUser']>> {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(firebaseAuth, user => {
      unsub();
      resolve(user);
    });
  });
}

