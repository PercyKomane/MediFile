import { API } from './client';

export type SupportReply = {
  reply_id: number;
  message: string;
  created_at: string;
  sender_email?: string;
};

export type SupportTicket = {
  ticket_id: number;
  subject: string;
  category?: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  replies: SupportReply[];
};

export const listTickets = async (): Promise<SupportTicket[]> => {
  const { data } = await API.get('/support-tickets/');
  return data as SupportTicket[];
};

export const createTicket = async (payload: {
  subject: string;
  category?: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}): Promise<SupportTicket> => {
  const { data } = await API.post('/support-tickets/', payload);
  return data as SupportTicket;
};

export const getTicket = async (id: number): Promise<SupportTicket> => {
  const { data } = await API.get(`/support-tickets/${id}/`);
  return data as SupportTicket;
};

export const replyToTicket = async (id: number, message: string): Promise<SupportReply> => {
  const { data } = await API.post(`/support-tickets/${id}/reply/`, { message });
  return data as SupportReply;
};

export const closeTicket = async (id: number): Promise<SupportTicket> => {
  const { data } = await API.post(`/support-tickets/${id}/close/`);
  return data as SupportTicket;
};


