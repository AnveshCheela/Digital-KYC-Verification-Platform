import { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('verifyflow_token');
      const savedUser = localStorage.getItem('verifyflow_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('verifyflow_token');
      localStorage.removeItem('verifyflow_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const { token: jwt, user: userData } = data;
    setToken(jwt);
    setUser(userData);
    localStorage.setItem('verifyflow_token', jwt);
    localStorage.setItem('verifyflow_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const data = await apiRegister(fullName, email, password);
    // After registration, auto-login if the API returns a token
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('verifyflow_token', data.token);
      localStorage.setItem('verifyflow_user', JSON.stringify(data.user));
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('verifyflow_token');
    localStorage.removeItem('verifyflow_user');
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
