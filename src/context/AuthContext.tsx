import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { loginApi, registerApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password?: string, forcedRole?: 'admin' | 'learner') => Promise<User>;
  register: (name: string, email: string, password?: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'authenticated' | 'unauthenticated'>('idle');

  useEffect(() => {
    const savedToken = sessionStorage.getItem('aurelia_auth_token');
    const savedUser = sessionStorage.getItem('aurelia_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setStatus('authenticated');
      } catch {
        sessionStorage.removeItem('aurelia_auth_token');
        sessionStorage.removeItem('aurelia_auth_user');
        setStatus('unauthenticated');
      }
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const login = async (email: string, password?: string, forcedRole?: 'admin' | 'learner'): Promise<User> => {
    setStatus('loading');
    try {
      const data = await loginApi(email, password, forcedRole);
      setUser(data.user);
      setToken(data.token);
      sessionStorage.setItem('aurelia_auth_token', data.token);
      sessionStorage.setItem('aurelia_auth_user', JSON.stringify(data.user));
      setStatus('authenticated');
      return data.user;
    } catch (err) {
      setStatus('unauthenticated');
      throw err;
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<User> => {
    setStatus('loading');
    try {
      const data = await registerApi(name, email, password);
      setUser(data.user);
      setToken(data.token);
      sessionStorage.setItem('aurelia_auth_token', data.token);
      sessionStorage.setItem('aurelia_auth_user', JSON.stringify(data.user));
      setStatus('authenticated');
      return data.user;
    } catch (err) {
      setStatus('unauthenticated');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('aurelia_auth_token');
    sessionStorage.removeItem('aurelia_auth_user');
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, token, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

