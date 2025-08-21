import { API } from './client';

export const fetchMyProfile = async () => {
  const { data } = await API.get('/me/');
  return Array.isArray(data) ? data[0] : data; // ViewSet list returns array
};

export const fetchMyMedicalHistory = async () => {
  const { data } = await API.get('/me/medical-history/');
  return data as any[];
};




