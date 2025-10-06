import { API } from './client';

export const fetchMyProfile = async () => {
  const { data } = await API.get('/me/');
  return Array.isArray(data) ? data[0] : data; // ViewSet list returns array
};

export const fetchMyMedicalHistory = async () => {
  const { data } = await API.get('/me/medical-history/');
  return data as any[];
};

// Vitals
export const listVitals = async () => {
  const { data } = await API.get('/me/vitals/');
  return data as any[];
};

export const addVital = async (payload: any) => {
  const { data } = await API.post('/me/vitals/', payload);
  return data as any;
};

// Lab Results
export const listLabResults = async () => {
  const { data } = await API.get('/me/lab-results/');
  return data as any[];
};

export const addLabResult = async (payload: any) => {
  const { data } = await API.post('/me/lab-results/', payload);
  return data as any;
};

export const updateLabResult = async (id: number | string, payload: any) => {
  const { data } = await API.patch(`/me/lab-results/${id}/`, payload);
  return data as any;
};

export const deleteLabResult = async (id: number | string) => {
  await API.delete(`/me/lab-results/${id}/`);
};

// Symptoms
export const listSymptoms = async () => {
  const { data } = await API.get('/me/symptoms/');
  return data as any[];
};

export const addSymptom = async (payload: any) => {
  const { data } = await API.post('/me/symptoms/', payload);
  return data as any;
};

export const updateSymptom = async (id: number | string, payload: any) => {
  const { data } = await API.patch(`/me/symptoms/${id}/`, payload);
  return data as any;
};

export const deleteSymptom = async (id: number | string) => {
  await API.delete(`/me/symptoms/${id}/`);
};

// DNA tests
export const listDnaTests = async () => {
  const { data } = await API.get('/me/dna-tests/');
  return data as any[];
};

export const addDnaTest = async (payload: any) => {
  const { data } = await API.post('/me/dna-tests/', payload);
  return data as any;
};

// Patient medications
export const listPatientMedications = async () => {
  const { data } = await API.get('/me/medications/');
  return data as any[];
};

export const addPatientMedication = async (payload: any) => {
  const { data } = await API.post('/me/medications/', payload);
  return data as any;
};

export const updatePatientMedication = async (id: number | string, payload: any) => {
  const { data } = await API.patch(`/me/medications/${id}/`, payload);
  return data as any;
};

export const deletePatientMedication = async (id: number | string) => {
  await API.delete(`/me/medications/${id}/`);
};




