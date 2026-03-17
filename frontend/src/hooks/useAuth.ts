import { useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  email: string | null;
}

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email');
    return { token, email };
  } catch {
    return { token: null, email: null };
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const saveAuth = useCallback((token: string, email: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_email', email);
    setAuth({ token, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    setAuth({ token: null, email: null });
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Kayıt başarısız.';
    saveAuth(data.token, data.email);
    return null;
  }, [saveAuth]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Giriş başarısız.';
    saveAuth(data.token, data.email);
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

  return {
    token: auth.token,
    email: auth.email,
    isLoggedIn: !!auth.token,
    login,
    logout,
    register,
    authFetch,
  };
}
