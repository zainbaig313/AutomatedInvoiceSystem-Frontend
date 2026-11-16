'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateUserDto, LoginRequestDto, UpdateUserDto, User } from '@/types';
import { api, clearStoredToken, getStoredToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  register: (dto: CreateUserDto) => Promise<void>;
  updateProfile: (dto: UpdateUserDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  const login = async (dto: LoginRequestDto) => {
    const res = await api.auth.login(dto);
    setToken(res.token);
    const profile = await api.auth.getMe();
    setUser(profile);
    router.push('/dashboard');
  };

  const register = async (dto: CreateUserDto) => {
    await api.auth.register(dto);
    // After register, automatically log in
    await login({ email: dto.email, password: dto.password });
  };

  const updateProfile = async (dto: UpdateUserDto) => {
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
