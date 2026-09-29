import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Web app's Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyAT3p5Xry1VhSy5cR5Kqm3nK0t0w0A4idA",
  authDomain: "ai-smart-agriculture-35f4d.firebaseapp.com",
  projectId: "ai-smart-agriculture-35f4d",
  storageBucket: "ai-smart-agriculture-35f4d.firebasestorage.app",
  messagingSenderId: "138437875985",
  appId: "1:138437875985:web:c715ce4d5a4d7385f0d4b0",
  measurementId: "G-7NVVGCQKTX"
};

// Initialize Firebase app singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Safe analytics initialization
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Firebase analytics init skipped:", e);
      }
    }
  }).catch(() => {
    // Analytics not supported in current environment
  });
}

// Error handling contracts
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity function
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or connection.");
      return false;
    }
    // Permissions error or non-existing doc is acceptable proof of online server response
    return true;
  }
}

// User-friendly Auth error descriptions
export function formatAuthError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const code = error.code || "";
  const msg = error.message || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in or reset your password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials or click 'Forgot password?'.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters (recommended: 8+ with letters, numbers, and symbols).";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in your Firebase console. Please visit Firebase Console > Authentication > Sign-in method to enable Email/Password.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Access to this account has been temporarily disabled. Please reset your password or try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing authentication.";
    case "auth/popup-blocked":
      return "The popup was blocked by your browser. Please allow popups for this site.";
    case "auth/network-request-failed":
      return "Network connection failed. Please check your internet connectivity.";
    case "auth/requires-recent-login":
      return "This sensitive operation requires a recent login. Please sign out and sign in again before updating.";
    case "auth/user-disabled":
      return "This user account has been disabled by an administrator.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Console > Authentication > Settings > Authorized domains. Please add this host domain to authorized domains.";
    default:
      return msg.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)\.?/, "").trim() || "An error occurred during authentication.";
  }
}
