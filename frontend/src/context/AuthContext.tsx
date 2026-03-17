import { createContext, useContext, useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  email: string | null;
}

interface AuthContextValue extends AuthState {
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

function loadAuth(): AuthState {
  return {
    token: localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token'),
    email: localStorage.getItem('auth_email') ?? sessionStorage.getItem('auth_email'),
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const saveAuth = useCallback((token: string, email: string, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
    storage.setItem('auth_email', email);
    setAuth({ token, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('ibispulse_watchlist');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_email');
    setAuth({ token: null, email: null });
  }, []);

  const register = useCallback(async (email: string, password: string, remember = false): Promise<string | null> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Kayıt başarısız.';
    saveAuth(data.token, data.email, remember);
    return null;
  }, [saveAuth]);

  const login = useCallback(async (email: string, password: string, remember = false): Promise<string | null> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Giriş başarısız.';
    saveAuth(data.token, data.email, remember);
    return null;
  }, [saveAuth]);

  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...options.headers,
      },
    });
  }, [auth.token]);

  return (
    <AuthContext.Provider value={{
      token: auth.token,
      email: auth.email,
      isLoggedIn: !!auth.token,
      login,
      register,
      logout,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
