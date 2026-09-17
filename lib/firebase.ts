import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY
    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || 'AIzaSyBZA0EsTsyLJyNssJx5DlzTciwSl175kf4',
  authDomain: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || 'vitalrpnet.firebaseapp.com',
  projectId: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || 'vitalrpnet',
  storageBucket: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || 'vitalrpnet.firebasestorage.app',
  messagingSenderId: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || '497680378833',
  appId: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_APP_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) || '1:497680378833:web:f9b6bbc9a9eb14a0428ef0',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
