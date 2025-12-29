import React, { createContext, useContext, useState, useEffect } from 'react';

// -----------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------
const DISCORD_CLIENT_ID = "1429603333416423614";

// Replace this with your actual Discord User ID (Snowflake)
const ADMIN_IDS = [
  "150580708144840704", // Damon
  // Add your ID here to give yourself admin access
];

interface User {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  editMode: boolean;
  login: () => void;
  logout: () => void;
  toggleEditMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  editMode: false,
  login: () => {},
  logout: () => {},
  toggleEditMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 1. Check for Hash on Load (Returning from Discord)
  useEffect(() => {
    // If the URL has a hash with access_token, we are returning from Discord
    if (window.location.hash.includes('access_token')) {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get('access_token');
      const tokenType = fragment.get('token_type');

      if (accessToken) {
        // Clear the hash from the URL so it looks clean
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch User Data from Discord
        fetch('https://discord.com/api/users/@me', {
          headers: {
            authorization: `${tokenType} ${accessToken}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            console.log("🔒 Discord Login Success. User ID:", data.id); 
            setUser(data);
            
            if (ADMIN_IDS.includes(data.id)) {
              setIsAdmin(true);
              console.log("✅ Admin Authorized");
            } else {
              console.log("❌ User is not in ADMIN_IDS list. ID:", data.id);
            }
          })
          .catch(err => console.error("Auth Error:", err));
      }
    }
  }, []);

  // 2. Login Function
  const login = () => {
    // IMPORTANT: This URL must match EXACTLY what is in the Discord Developer Portal > OAuth2 > Redirects
    // We are using window.location.origin (e.g., http://localhost:5173) without a trailing slash.
    const redirectBase = window.location.origin;
    const redirectUri = encodeURIComponent(redirectBase);
    
    console.log("Attempting Discord Login...");
    console.log("Configured Redirect URI being sent:", redirectBase);
    console.log("Ensure this EXACT URL is added to your Discord Developer Portal under OAuth2 > Redirects");

    // Scope 'identify' is enough to get the User ID
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
    
    window.location.href = url;
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    setEditMode(false);
  };

  const toggleEditMode = () => {
    if (isAdmin) setEditMode(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, editMode, login, logout, toggleEditMode }}>
      {children}
    </AuthContext.Provider>
  );
};