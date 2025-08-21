// Create axios API client with JWT auth
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// IMPORTANT: This must point to your Django server, not the Metro bundler (8081).
// If your Django runs on a different host/port, update accordingly.
function resolveApiBaseUrl(): string {
  try {
    const anyConstants = Constants as any;
    const hostUri: string | undefined = anyConstants?.expoGoConfig?.hostUri || anyConstants?.manifest?.debuggerHost || anyConstants?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:8000/api`;
    }
  } catch {}
  return 'http://192.168.88.253:8000/api';
}

// Public API client for endpoints that don't require authentication
export const PublicAPI = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

// Authenticated API client for endpoints that require authentication
export const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

 
