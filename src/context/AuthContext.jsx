import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("bcmrv_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setRole(parsed.role);
      setWalletAddress(parsed.walletAddress);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData) => {
    const enriched = { ...userData };
    setUser(enriched);
    setRole(enriched.role);
    setWalletAddress(enriched.walletAddress || null);
    setIsAuthenticated(true);
    localStorage.setItem("bcmrv_user", JSON.stringify(enriched));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setWalletAddress(null);
    setIsAuthenticated(false);
    localStorage.removeItem("bcmrv_user");
    window.location.href = "/login";
  };

  const connectWallet = () => {
    // Mock MetaMask connection
    const mockAddr = "0x7a3B" + Math.random().toString(16).slice(2, 38).toUpperCase();
    setWalletAddress(mockAddr);
    if (user) {
      const updated = { ...user, walletAddress: mockAddr };
      setUser(updated);
      localStorage.setItem("bcmrv_user", JSON.stringify(updated));
    }
    return mockAddr;
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    if (user) {
      const updated = { ...user, walletAddress: null };
      setUser(updated);
      localStorage.setItem("bcmrv_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, role, walletAddress,
      login, logout, connectWallet, disconnectWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
