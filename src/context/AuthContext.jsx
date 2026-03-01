import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    role: null,
    walletAddress: null,
    loading: true
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("LOGIN");
  const navigate = useNavigate();

  const { isAuthenticated, user, role, walletAddress, loading } = authState;
  const SESSION_DURATION = 24 * 60 * 60 * 1000;

  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const loginWithToken = useCallback((userData, token) => {
    const now = Date.now().toString();
    localStorage.setItem("bcmrv_token", token);
    localStorage.setItem("bcmrv_user", JSON.stringify(userData));
    localStorage.setItem("bcmrv_login_at", now);
    setAuthState({
      isAuthenticated: true,
      user: userData,
      role: userData.role,
      walletAddress: userData.walletAddress,
      loading: false
    });
  }, []);

  const login = useCallback((userData) => {
    const now = Date.now().toString();
    localStorage.setItem("bcmrv_user", JSON.stringify(userData));
    localStorage.setItem("bcmrv_login_at", now);
    setAuthState({
      isAuthenticated: true,
      user: userData,
      role: userData.role,
      walletAddress: userData.walletAddress || null,
      loading: false
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bcmrv_token");
    localStorage.removeItem("bcmrv_user");
    localStorage.removeItem("bcmrv_login_at");
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
      walletAddress: null,
      loading: false
    });
    wagmiDisconnect();
    navigate("/", { replace: true });
  }, [navigate, wagmiDisconnect]);

  const checkSessionExpiration = useCallback(() => {
    const loginAt = localStorage.getItem("bcmrv_login_at");
    if (loginAt) {
      const elapsed = Date.now() - parseInt(loginAt, 10);
      if (elapsed > SESSION_DURATION) {
        console.warn("Session expired (24h limit). Logging out.");
        logout();
        return true;
      }
    }
    return false;
  }, [logout, SESSION_DURATION]);

  useEffect(() => {
    if (checkSessionExpiration()) return;

    const token = localStorage.getItem("bcmrv_token");
    if (token) {
      authAPI.getMe()
        .then((res) => {
          const u = res.data.data.user;
          setAuthState({
            isAuthenticated: true,
            user: u,
            role: u.role,
            walletAddress: u.walletAddress,
            loading: false
          });
        })
        .catch(() => {
          localStorage.removeItem("bcmrv_token");
          localStorage.removeItem("bcmrv_user");
          setAuthState(prev => ({ ...prev, loading: false }));
        });
    } else {
      const storedUser = localStorage.getItem("bcmrv_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setAuthState({
            isAuthenticated: true,
            user: parsed,
            role: parsed.role,
            walletAddress: parsed.walletAddress,
            loading: false
          });
        } catch {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [checkSessionExpiration]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkSessionExpiration();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionExpiration]);

  useEffect(() => {
    if (!wagmiAddress || !isAuthenticated) return;

    const newAddr = wagmiAddress.toLowerCase();
    const currentAddr = walletAddress;

    if (currentAddr && newAddr !== currentAddr) {
      localStorage.removeItem("bcmrv_token");
      localStorage.removeItem("bcmrv_user");
      localStorage.removeItem("bcmrv_login_at");
      setAuthState({
        isAuthenticated: false,
        user: null,
        role: null,
        walletAddress: null,
        loading: false,
      });
      navigate("/", { replace: true });
    }
  }, [wagmiAddress, isAuthenticated, walletAddress, navigate]);

  const openLogin = () => {
    setAuthModalMode("LOGIN");
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode("REGISTER");
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signMessage = useCallback(async () => {
    const message = `Sign in to Blue Carbon MRV\nTimestamp: ${Date.now()}`;
    const signature = await signMessageAsync({ message });
    return { message, signature };
  }, [signMessageAsync]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, role, walletAddress: wagmiAddress?.toLowerCase() || walletAddress, loading,
      isAuthModalOpen, authModalMode,
      login, loginWithToken, logout,
      signMessage,
      wagmiAddress, wagmiConnected,
      openLogin, openRegister, closeAuthModal, setAuthModalMode
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
