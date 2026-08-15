import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseAuthSignOut,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";

const rawApiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || '';
const rawAuthDomain = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || '';
const rawProjectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || '';
const rawStorageBucket = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || '';
const rawMessagingSenderId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || '';
const rawAppId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || '';

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  !rawApiKey.includes('placeholder') &&
  rawApiKey.length > 10 &&
  rawAuthDomain &&
  !rawAuthDomain.includes('placeholder') &&
  rawProjectId &&
  !rawProjectId.includes('placeholder')
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : 'AIzaSyPlaceholderKeyForBuildSafetyOnly000',
  authDomain: isFirebaseConfigured ? rawAuthDomain : 'placeholder.firebaseapp.com',
  projectId: isFirebaseConfigured ? rawProjectId : 'placeholder-project',
  storageBucket: rawStorageBucket || (isFirebaseConfigured ? `${rawProjectId}.appspot.com` : 'placeholder.appspot.com'),
  messagingSenderId: rawMessagingSenderId || '1234567890',
  appId: rawAppId || '1:1234567890:web:abcdef1234567890'
};

// Initialize Firebase App only for Google Authentication
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Maps Firebase Auth error codes into human-readable, safe error messages
 */
export function getFriendlyFirebaseErrorMessage(error: any): string {
  if (!error) return 'Google authentication encountered an unexpected error.';
  const code = error?.code || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site to sign in with Google.';
    case 'auth/cancelled-popup-request':
      return 'Authentication was cancelled due to another active request.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different login method. Please sign in with your email & password.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in your Firebase Console. Please add this domain under Firebase Console > Authentication > Settings > Authorized Domains.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in your Firebase Console. Please enable the Google provider under Firebase Console > Authentication > Sign-in method.';
    case 'auth/user-disabled':
      return 'This Google account has been disabled by the administrator.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API Key. Please verify your VITE_FIREBASE_API_KEY environment variable.';
    case 'auth/app-deleted':
      return 'Firebase application was deleted or uninitialized.';
    default:
      return error.message || 'Failed to authenticate with Google. Please try again.';
  }
}

/**
 * Execute real Firebase Google authentication flow
 */
export async function authenticateWithGoogle(): Promise<{
  user: FirebaseUser;
  idToken: string;
  email: string;
  displayName: string | null;
}> {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your environment variables.'
    );
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  if (!user.email) {
    throw new Error('No verified email address found on the selected Google account.');
  }

  const idToken = await user.getIdToken();

  return {
    user,
    idToken,
    email: user.email,
    displayName: user.displayName
  };
}

/**
 * Sign out of Firebase Auth cleanly
 */
export async function signOutFirebase(): Promise<void> {
  try {
    if (auth) {
      await firebaseAuthSignOut(auth);
    }
  } catch (err) {
    console.warn('[Firebase] Sign out error:', err);
  }
}
