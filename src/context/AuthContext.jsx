import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
    navigate("/", { replace: true });
  }, [navigate]);

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

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to continue.");
      return null;
    }
    try {
      const permissions = await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accountsPerm = permissions.find(p => p.parentCapability === "eth_accounts");
      const grantedAccounts = accountsPerm?.caveats?.[0]?.value || [];

      if (grantedAccounts.length === 0) {
        const fallback = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!fallback || fallback.length === 0) return null;
        var addr = fallback[0].toLowerCase();
      } else {
        var addr = grantedAccounts[grantedAccounts.length - 1].toLowerCase();
      }

      setAuthState(prev => {
        const newState = { ...prev, walletAddress: addr };
        if (prev.user) {
          newState.user = { ...prev.user, walletAddress: addr };
          localStorage.setItem("bcmrv_user", JSON.stringify(newState.user));
        }
        return newState;
      });

      return addr;
    } catch (err) {
      if (err.code === 4001) {
        console.log("User rejected wallet connection");
      } else {
        console.error("Wallet connect failed:", err);
      }
      return null;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAuthState(prev => {
      const newState = { ...prev, walletAddress: null };
      if (prev.user) {
        newState.user = { ...prev.user, walletAddress: null };
        localStorage.setItem("bcmrv_user", JSON.stringify(newState.user));
      }
      return newState;
    });
  }, []);

  const signMessage = useCallback(async (address) => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const message = `Sign in to Blue Carbon MRV\nTimestamp: ${Date.now()}`;
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });
    return { message, signature };
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        logout();
        return;
      }

      const newAddr = accounts[0].toLowerCase();
      const currentAddr = authState.walletAddress;

      if (currentAddr && newAddr !== currentAddr && authState.isAuthenticated) {
        localStorage.removeItem("bcmrv_token");
        localStorage.removeItem("bcmrv_user");
        localStorage.removeItem("bcmrv_login_at");

        try {
          const message = `Sign in to Blue Carbon MRV\nTimestamp: ${Date.now()}`;
          const signature = await window.ethereum.request({
            method: "personal_sign",
            params: [message, newAddr],
          });

          const res = await authAPI.loginWallet(newAddr, signature, message);

          const { user: userData, token } = res.data.data;
          loginWithToken(userData, token);

          const dashRoutes = {
            ADMIN: "/admin/dashboard",
            FIELD_OFFICER: "/field/dashboard",
            VALIDATOR: "/validator/dashboard",
            USER: "/user/dashboard",
          };
          navigate(dashRoutes[userData.role] || "/", { replace: true });
        } catch (err) {
          console.error("Account switch re-auth failed:", err);
          setAuthState({
            isAuthenticated: false,
            user: null,
            role: null,
            walletAddress: newAddr,
            loading: false,
          });
          navigate("/", { replace: true });
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [authState.walletAddress, authState.isAuthenticated, loginWithToken, logout, navigate]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, role, walletAddress, loading,
      isAuthModalOpen, authModalMode,
      login, loginWithToken, logout,
      connectWallet, disconnectWallet, signMessage,
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
