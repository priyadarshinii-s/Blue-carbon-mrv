import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setIsAuthenticated(true);
    setRole(userData.role);
    setUser(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, role, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
