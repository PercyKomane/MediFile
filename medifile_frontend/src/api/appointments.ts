import { API, PublicAPI } from './client';

export const listMyAppointments = async () => {
  const { data } = await API.get('/appointments/my/');
  return data as any[];
};

export const listDoctorPending = async () => {
  const { data } = await API.get('/appointments/pending/');
  return data as any[];
};

export const approveAppointment = async (id: number) => {
  const { data } = await API.post(`/appointments/${id}/approve/`, {});
  return data;
};

export const declineAppointment = async (id: number) => {
  const { data } = await API.post(`/appointments/${id}/decline/`, {});
  return data;
};

export const cancelAppointment = async (id: number) => {
  const { data } = await API.post(`/appointments/${id}/cancel/`, {});
  return data;
};

export const updateAppointment = async (id: number, updates: any) => {
  const { data } = await API.patch(`/appointments/${id}/`, updates);
  return data;
};

export const listAvailableSlots = async (doctorId?: number) => {
  const { data } = await PublicAPI.get('/slots/', { params: doctorId ? { doctor: doctorId } : {} });
  return data as any[];
};

export const bookAppointment = async (slotId: number) => {
  const { data } = await API.post('/appointments/book/', { slot_id: slotId });
  return data;
};

export const payAppointment = async (appointmentId: number, payload: { amount: number; reference?: string }) => {
  const { data } = await API.post(`/appointments/${appointmentId}/pay/`, payload);
  return data;
};

export const listMyPatients = async () => {
  const { data } = await API.get('/appointments/my-patients/');
  return data as any[];
};



