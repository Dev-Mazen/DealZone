import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginApi, logout as logoutApi } from '../api/auth';
import { getAccessToken, clearTokens } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);  // initial auth check

  // ── Load current user on mount ──────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    await loginApi(credentials);
    const me = await getMe();
    setUser(me);
    return me;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  // ── Refresh user profile (after company registration, etc.) ─────────────────
  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
    return me;
  }, []);

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(user);
  const isAdmin         = user?.isSystemAdmin === true;
  const company         = user?.company ?? null;
  const companyRole     = company?.role ?? null;
  const isApproved      = company?.canPerformCommercialActivities === true;

  const hasRole = (...roles) => roles.includes(companyRole);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        company,
        companyRole,
        isApproved,
        hasRole,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;

