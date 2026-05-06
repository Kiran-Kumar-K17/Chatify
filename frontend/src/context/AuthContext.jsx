import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("chatUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);

  // On mount, verify the cookie is still valid and refresh user data
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await API.get("/users/me");
        const freshUser = res.data;
        setUser(freshUser);
        localStorage.setItem("chatUser", JSON.stringify(freshUser));
      } catch {
        // Cookie expired or invalid — clear stale localStorage
        setUser(null);
        localStorage.removeItem("chatUser");
      } finally {
        setAuthChecked(true);
      }
    };
    verify();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("chatUser", JSON.stringify(userData));
  };

  // Called after a profile picture update to sync state everywhere
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("chatUser", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await API.post("/users/logout");
    } catch {
      /* ignore — cookie will expire naturally */
    }
    setUser(null);
    localStorage.removeItem("chatUser");
  };

  // Don't render the app until the auth check finishes (avoids flash of wrong state)
  if (!authChecked) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0e2e",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(99,102,241,0.3)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
