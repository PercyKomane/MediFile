import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthAPI from '../api/auth';
import { API } from '../api/client';

type AuthContextValue = {
  token: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  role: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await AuthAPI.login(email, password);
    const access = result?.access ?? '';
    if (!access) throw new Error('No access token returned');
    await AsyncStorage.setItem('token', access);
    setToken(access);
    try {
      const { data } = await API.get('/me/');
      setRole(data?.role ?? null);
    } catch (error: any) {
      // If we can't get user info, clear the token
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
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
    const t = await AsyncStorage.getItem('token');
    if (t) await AsyncStorage.removeItem('token');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

 
