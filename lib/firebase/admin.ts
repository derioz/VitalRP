import 'server-only';
import * as admin from 'firebase-admin';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  // Replace escaped newlines with actual newlines if necessary
  return key.replace(/\\n/g, '\n');
}

function getFirebaseAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Firebase Admin credentials missing. Server operations requiring Admin SDK will not function until FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
    return null;
  }
}

const adminApp = getFirebaseAdminApp();

export const adminDb = adminApp ? admin.firestore(adminApp) : null;
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminStorage = adminApp ? admin.storage(adminApp) : null;
export { admin };
