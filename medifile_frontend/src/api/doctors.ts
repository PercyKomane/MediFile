import { PublicAPI } from './client';

export const listDoctors = async () => {
  const { data } = await PublicAPI.get('/doctors/');
  return data as any[];
};




