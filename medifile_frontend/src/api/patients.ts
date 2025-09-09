import { API } from './client';

export const getPatient = async (patientId: number | string) => {
  const { data } = await API.get(`/patients/${patientId}/`);
  return data as any;
};


