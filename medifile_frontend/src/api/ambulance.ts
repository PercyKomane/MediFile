import { API } from './client';

export interface AmbulanceRequest {
  request_id: number;
  note?: string;
  audio_file?: string | null;
  audio_file_url?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status: 'requested' | 'pending' | 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  assigned_hospital?: {
    hospital_id: number;
    name: string;
    address: string;
    contact_number: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  eta_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export const createAmbulanceRequest = async (formData: FormData): Promise<AmbulanceRequest> => {
  const response = await API.post('/ambulance-requests/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAmbulanceRequestStatus = async (requestId: number): Promise<AmbulanceRequest> => {
  const response = await API.get(`/ambulance-requests/${requestId}/status/`);
  return response.data;
};

export const cancelAmbulanceRequest = async (requestId: number): Promise<AmbulanceRequest> => {
  const response = await API.post(`/ambulance-requests/${requestId}/cancel/`);
  return response.data;
};

export const listAmbulanceRequests = async (): Promise<AmbulanceRequest[]> => {
  const response = await API.get('/ambulance-requests/');
  return response.data;
};

export const getMostRecentActiveAmbulanceRequest = async (): Promise<AmbulanceRequest | null> => {
  const requests = await listAmbulanceRequests();
  const isTerminal = (s: string | undefined) => ['arrived', 'completed', 'cancelled'].includes(String(s));
  return requests.find(r => !isTerminal(r.status)) || null;
};

export const updateAmbulanceRequest = async (
  requestId: number,
  data: { note?: string; audio_file?: any }
): Promise<AmbulanceRequest> => {
  const form = new FormData();
  if (data.note !== undefined) form.append('note', data.note);
  if (data.audio_file) form.append('audio_file', data.audio_file);
  const response = await API.patch(`/ambulance-requests/${requestId}/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


