'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearStoredToken, getStoredToken } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const activeToken = getStoredToken();
      if (!activeToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      setToken(activeToken);
      const profile = await api.auth.getMe();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user profile', err);
      clearStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (dto) => {
    const res = await api.auth.login(dto);
    setToken(res.token);
    const profile = await api.auth.getMe();
    setUser(profile);
    router.push('/dashboard');
  };

  const register = async (dto) => {
    await api.auth.register(dto);
    // After register, automatically log in
    await login({ email: dto.email, password: dto.password });
  };

  const updateProfile = async (dto) => {
    const updated = await api.auth.update(user?.id ?? 0, dto);
    setUser(updated);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
