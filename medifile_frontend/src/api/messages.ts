import { API } from './client';

export const ensureConversation = async (params: { doctor_id?: number; patient_id?: number }) => {
  const { data } = await API.post('/conversations/', params);
  return data as { conversation_id: number };
};

export const listConversations = async () => {
  const { data } = await API.get('/conversations/');
  return data as any[];
};

export const getConversation = async (conversationId: number) => {
  const { data } = await API.get(`/conversations/${conversationId}/`);
  return data as any;
};

export const listMessages = async (conversationId: number) => {
  const { data } = await API.get('/messages/', { params: { conversation: conversationId } });
  return data as any[];
};

export const sendMessage = async (conversationId: number, text: string) => {
  const { data } = await API.post('/messages/', { conversation: conversationId, text });
  return data;
};


