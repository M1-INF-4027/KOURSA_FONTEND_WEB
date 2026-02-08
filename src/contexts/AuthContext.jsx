import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, usersService } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuth = !!token && !!user;

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await usersService.getMe();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch {
      // Don't logout here — the axios interceptor handles 401 + refresh
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { access, refresh, user: userData } = res.data;

    // Store both tokens
    localStorage.setItem('authToken', access);
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    }
    setToken(access);

    // Use user data from login response directly
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }

    // Fallback: fetch user separately if not in response
    const userRes = await usersService.getMe();
    setUser(userRes.data);
    localStorage.setItem('user', JSON.stringify(userRes.data));
    return userRes.data;
  }, []);

  const updateUser = useCallback((data) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // On mount: restore user from localStorage, then validate in background
  useEffect(() => {
    const init = async () => {
      if (token) {
        // 1) Restore user from localStorage immediately (instant UI)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // invalid JSON, ignore
          }
        }

        // 2) Validate token with API in background
        // The axios interceptor will auto-refresh if the access token is expired
        try {
          const res = await usersService.getMe();
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          // Only logout if it's a definitive auth failure (401 after refresh attempt failed)
          // The axios interceptor already tried to refresh and did forceLogout if refresh failed
          // So if we reach here with 401, the interceptor already handled it
          // For other errors (404, 500, network), keep the cached user
          if (err.response?.status === 401) {
            logout();
          }
          // else: keep cached user, the app stays functional
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuth, isLoading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
