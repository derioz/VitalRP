import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let db: ReturnType<typeof getFirestore> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        console.log("Firebase initialized successfully with config:", {
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain
        });
    } catch (e) {
        console.warn("Firebase initialization failed:", e);
    }
} else {
    console.warn("Firebase config missing. Running in demo/local mode.");
}

export { db, auth, storage };
