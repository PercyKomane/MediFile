import { API } from './client';

export interface FAQ {
  faq_id: number;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface UserQuestion {
  question_id: number;
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  answered_at?: string;
  user_email: string;
}

export interface CreateUserQuestionData {
  question: string;
}

// Get all FAQs
export const getFAQs = async (): Promise<FAQ[]> => {
  const response = await API.get('/faqs/');
  return response.data;
};

// Get FAQs by category
export const getFAQsByCategory = async (category: string): Promise<FAQ[]> => {
  const response = await API.get(`/faqs/by_category/?category=${category}`);
  return response.data;
};

// Get FAQ categories
export const getFAQCategories = async (): Promise<string[]> => {
  const response = await API.get('/faqs/categories/');
  return response.data;
};

// Get user questions
export const getUserQuestions = async (): Promise<UserQuestion[]> => {
  const response = await API.get('/user-questions/my_questions/');
  return response.data;
};

// Create a new user question
export const createUserQuestion = async (data: CreateUserQuestionData): Promise<UserQuestion> => {
  const response = await API.post('/user-questions/', data);
  return response.data;
};
