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


