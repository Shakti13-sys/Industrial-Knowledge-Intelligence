import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, getSavedUsername, getToken, setSession } from './api';

interface AuthContextValue {
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    const savedUser = getSavedUsername();
    if (token && savedUser) setUsername(savedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const result = await api.login(u, p);
    setSession(result.access_token, result.username);
    setUsername(result.username);
  }, []);

  const register = useCallback(async (u: string, p: string) => {
    const result = await api.register(u, p);
    setSession(result.access_token, result.username);
    setUsername(result.username);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUsername(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ username, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
