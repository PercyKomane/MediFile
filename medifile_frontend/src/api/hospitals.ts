import { API } from './client';

export interface Hospital {
  hospital_id: number;
  name: string;
  address: string;
  contact_number: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface Doctor {
  doctor_id: number;
  user: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
  specialization: string;
  hospital: Hospital;
}

export const listHospitals = async (): Promise<Hospital[]> => {
  const response = await API.get('/hospitals/');
  return response.data;
};

export const getHospital = async (hospitalId: number): Promise<Hospital> => {
  const response = await API.get(`/hospitals/${hospitalId}/`);
  return response.data;
};

export const getHospitalDoctors = async (hospitalId: number): Promise<Doctor[]> => {
  const response = await API.get(`/hospitals/${hospitalId}/doctors/`);
  return response.data;
};
