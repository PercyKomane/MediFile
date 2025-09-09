import { PublicAPI } from './client';

export const listDoctors = async (params?: { search?: string; hospital?: number }) => {
  const { data } = await PublicAPI.get('/doctors/', { params });
  return data as any[];
};

export const getDoctor = async (doctorId: number | string) => {
  const { data } = await PublicAPI.get(`/doctors/${doctorId}/`);
  return data as any;
};




