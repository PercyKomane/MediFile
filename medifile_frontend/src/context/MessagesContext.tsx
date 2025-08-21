import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import * as MessagesAPI from '../api/messages';

export type Sender = 'doctor' | 'user' | 'system' | 'typing';

export type ChatMessage = {
  id: string;
  text?: string;
  sender: Sender;
  time?: string;
  createdAt?: number;
};

type ConversationState = Record<string, ChatMessage[]>; // keyed by doctorId

type MessagesContextValue = {
  getConversation: (doctorId: string) => ChatMessage[];
  sendMessage: (doctorId: string, text: string) => void;
  seedConversationIfMissing: (doctorId: string, doctorName: string) => void;
  getOrCreateBackendConversation: (doctorId: string) => Promise<number>; // returns conversationId
};

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationState>({});

  const getConversation = (doctorId: string) => conversations[doctorId] ?? [];

  const seedConversationIfMissing = (doctorId: string, doctorName: string) => {
    setConversations((prev) => {
      if (prev[doctorId]) return prev;
      const seeded: ChatMessage[] = [
        {
          id: `${doctorId}-sys-1`,
          sender: 'system',
          text: 'Consultation Start\nYou can consult your problem to the doctor',
          createdAt: Date.now(),
        },
        {
          id: `${doctorId}-d-1`,
          sender: 'doctor',
          text: 'Hello, How can I help you?',
          time: 'now',
          createdAt: Date.now(),
        },
      ];
      return { ...prev, [doctorId]: seeded };
    });
  };

  const sendMessage = (doctorId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setConversations((prev) => {
      const list = prev[doctorId] ?? [];
      const withoutTyping = list.filter((m) => m.sender !== 'typing');
      const next: ChatMessage[] = [
        ...withoutTyping,
        { id: `${doctorId}-u-${Date.now()}`, sender: 'user', text: trimmed, time: 'Just now', createdAt: Date.now() },
        { id: `${doctorId}-typing-${Date.now()}`, sender: 'typing', createdAt: Date.now() },
      ];
      return { ...prev, [doctorId]: next };
    });

    // simple auto-reply after a short delay to simulate doctor response
    setTimeout(() => {
      setConversations((prev) => {
        const list = prev[doctorId] ?? [];
        const withoutTyping = list.filter((m) => m.sender !== 'typing');
        const next: ChatMessage[] = [
          ...withoutTyping,
          {
            id: `${doctorId}-d-${Date.now()}`,
            sender: 'doctor',
            text: 'Thanks for the details. I will advise shortly.',
            time: 'now',
            createdAt: Date.now(),
          },
        ];
        return { ...prev, [doctorId]: next };
      });
    }, 1200);
  };

  const getOrCreateBackendConversation = async (doctorId: string) => {
    // In a real app we would map doctorId string -> numeric backend id
    const numericDoctorId = parseInt(doctorId.replace(/\D/g, ''), 10) || 1;
    const conv = await MessagesAPI.ensureConversation({ doctor_id: numericDoctorId });
    return conv.conversation_id;
  };

  const value = useMemo<MessagesContextValue>(() => ({ getConversation, sendMessage, seedConversationIfMissing, getOrCreateBackendConversation }), [conversations]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
};

export const useMessages = (): MessagesContextValue => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within a MessagesProvider');
  return ctx;
};


