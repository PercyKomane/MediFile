import { API } from './client';

export type PrivacySettings = {
  settings_id: number;
  show_profile_to_doctors: boolean;
  show_contact_info_to_doctors: boolean;
  allow_marketing_emails: boolean;
  share_anonymized_analytics: boolean;
  allow_chat_requests: boolean;
};

export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  const { data } = await API.get('/me/privacy/');
  return data as PrivacySettings;
};

export const updatePrivacySettings = async (payload: Partial<PrivacySettings>): Promise<PrivacySettings> => {
  const { data } = await API.patch('/me/privacy/', payload);
  return data as PrivacySettings;
};

export const uploadAvatar = async (uri: string) => {
  const form = new FormData();
  // Infer filename and type crudely; Expo provides uri like file://...
  const filename = uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename || '');
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  form.append('avatar', {
    // @ts-ignore react-native FormData file shape
    uri,
    name: filename,
    type,
  });
  const { data } = await API.post('/me/upload_avatar/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};


