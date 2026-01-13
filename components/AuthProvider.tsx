import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// -----------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------
// TODO: Replace with the actual email address provided by the user
const ADMIN_EMAILS = [
  "tx.davidj@gmail.com",
  // Add more emails here
];

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  editMode: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  toggleEditMode: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  editMode: false,
  login: async () => { },
  logout: async () => { },
  toggleEditMode: () => { },
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && currentUser.email) {
        let isAuthorized = false;

        // 1. Check Hardcoded Superadmins (Fallback)
        if (ADMIN_EMAILS.includes(currentUser.email)) {
          isAuthorized = true;
        }

        // 2. Check Firestore Permissions & Auto-Save
        if (db) {
          try {
            const userRef = doc(db, 'users', currentUser.email.toLowerCase());
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.role === 'superadmin' || userData.role === 'admin' || userData.role === 'editor' || userData.role === 'owner') { // 'owner' kept for legacy
                isAuthorized = true;
              }
              // Update latest info
              await setDoc(userRef, {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                lastLogin: new Date()
              }, { merge: true });
            } else {
              // Create new user entry
              await setDoc(userRef, {
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: 'user', // Default role
                createdAt: new Date(),
                lastLogin: new Date()
              });
            }
          } catch (err) {
            console.error("Error fetching/saving user:", err);
          }
        }

        setIsAdmin(isAuthorized);
        if (isAuthorized) console.log("✅ Admin Authorized:", currentUser.email);
        else console.log("❌ User not authorized (Role: User/None):", currentUser.email);

      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setEditMode(false);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleEditMode = () => {
    if (isAdmin) setEditMode(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, editMode, login, logout, toggleEditMode, loading }}>
      {children}
    </AuthContext.Provider>
  );
};