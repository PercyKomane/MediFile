import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthAPI from '../api/auth';
import { API } from '../api/client';

type AuthContextValue = {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  role: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshAccessToken: async () => '',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        if (t) {
          setToken(t);
          try {
            const { data } = await API.get('/me/');
            setRole(data?.role ?? null);
          } catch (error: any) {
            // If token is invalid, clear it
            if (error?.response?.status === 401) {
              console.log('Token is invalid, clearing...');
              await AsyncStorage.removeItem('token');
              setToken(null);
              setRole(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading token:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await AuthAPI.login(email, password);
    const access = result?.access ?? '';
    const refresh = result?.refresh ?? '';
    if (!access) throw new Error('No access token returned');
    await AsyncStorage.setItem('token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    setToken(access);
    try {
      const { data } = await API.get('/me/');
      setRole(data?.role ?? null);
    } catch (error: any) {
      // If we can't get user info, clear the token
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refresh_token');
        setToken(null);
        setRole(null);
        throw new Error('Login failed - invalid credentials');
      }
    }
  };

  const register = async (payload: any) => {
    try {
      await AuthAPI.register(payload);
    } catch (e: any) {
      // Re-throw a clean error that UI can surface
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? 'Registration failed');
      throw new Error(msg);
    }
    await login(payload.email, payload.password);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refresh_token');
      setToken(null);
      setRole(null);
      console.log('✅ Logout successful - tokens cleared');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, clear the state
      setToken(null);
      setRole(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token available');
      }
      
      const result = await AuthAPI.refreshToken(refresh);
      const newAccess = result?.access ?? '';
      if (!newAccess) throw new Error('No access token returned from refresh');
      
      await AsyncStorage.setItem('token', newAccess);
      setToken(newAccess);
      return newAccess;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, isLoading, login, register, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

 
