// Create axios API client with JWT auth
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Add request/response logging for debugging
const logRequest = (config: any) => {
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    timeout: config.timeout,
  });
  return config;
};

const logResponse = (response: any) => {
  console.log('✅ API Response:', {
    status: response.status,
    url: response.config.url,
    data: response.data,
  });
  return response;
};

const logError = (error: any) => {
  console.log('❌ API Error:', {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url,
    timeout: error.code === 'ECONNABORTED',
    data: error.response?.data,
  });
  return Promise.reject(error);
};

// IMPORTANT: This must point to your Django server, not the Metro bundler (8081).
// If your Django runs on a different host/port, update accordingly.
function resolveApiBaseUrl(): string {
  try {
    const anyConstants = Constants as any;
    const hostUri: string | undefined = anyConstants?.expoGoConfig?.hostUri || anyConstants?.manifest?.debuggerHost || anyConstants?.manifest2?.extra?.expoClient?.hostUri;
    console.log('🔍 Debug - Constants:', {
      expoGoConfig: anyConstants?.expoGoConfig?.hostUri,
      manifest: anyConstants?.manifest?.debuggerHost,
      manifest2: anyConstants?.manifest2?.extra?.expoClient?.hostUri,
    });
    if (hostUri) {
      const host = hostUri.split(':')[0];
      const url = `http://${host}:8000/api`;
      console.log('🔍 Debug - Resolved URL:', url);
      return url;
    }
  } catch (error) {
    console.log('🔍 Debug - Error resolving URL:', error);
  }
  const fallbackUrl = 'http://localhost:8000/api';
  console.log('🔍 Debug - Using fallback URL:', fallbackUrl);
  return fallbackUrl;
}

// Public API client for endpoints that don't require authentication
export const PublicAPI = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000, // Increased to 30 seconds
});

// Authenticated API client for endpoints that require authentication
export const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000, // Increased to 30 seconds
});

// Add interceptors for debugging
PublicAPI.interceptors.request.use(logRequest);
PublicAPI.interceptors.response.use(logResponse, logError);

API.interceptors.request.use(logRequest);
API.interceptors.response.use(logResponse, logError);

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

 
