import { API } from './client';

export const login = async (email: string, password: string) => {
  // DRF SimpleJWT expects 'username' by default; send both for compatibility
  const { data } = await API.post('/auth/token/', { username: email, email, password });
  return data as { access: string; refresh: string };
};

export const register = async (payload: {
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}) => {
  const { data } = await API.post('/auth/register/', payload);
  return data;
};




