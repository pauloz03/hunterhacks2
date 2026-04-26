import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("landed_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function login(userData) {
    setUser(userData);
    localStorage.setItem("landed_user", JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("landed_user");
  }

  function updateUser(updates) {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const nextUser = { ...prevUser, ...updates };
      localStorage.setItem("landed_user", JSON.stringify(nextUser));
      return nextUser;
    });
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
