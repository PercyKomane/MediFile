import { API } from './client';

export const changePassword = async (current_password: string, new_password: string) => {
  const { data } = await API.post('/me/change_password/', { current_password, new_password });
  return data as { detail: string };
};

export type SecurityState = {
  security_id: number;
  is_totp_enabled: boolean;
};

export const getSecurity = async (): Promise<SecurityState> => {
  const { data } = await API.get('/me/security/');
  return data as SecurityState;
};

export const beginTotp = async (): Promise<{ secret: string; otpauth_url: string }> => {
  const { data } = await API.post('/me/totp_begin/');
  return data as { secret: string; otpauth_url: string };
};

export const confirmTotp = async (code: string): Promise<{ backup_codes: string[] }> => {
  const { data } = await API.post('/me/totp_confirm/', { code });
  return data as { backup_codes: string[] };
};

export const disableTotp = async (): Promise<{ detail: string }> => {
  const { data } = await API.post('/me/totp_disable/');
  return data as { detail: string };
};
