import { API } from './client';

export interface PaymentMethod {
  payment_method_id: number;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  masked_number: string;
  expiry_date?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreatePaymentMethodData {
  type: 'card' | 'bank' | 'wallet';
  name: string;
  encrypted_number: string;
  expiry_date?: string;
}

// Get all payment methods for the current user
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await API.get('/payment-methods/');
  return response.data;
};

// Create a new payment method
export const createPaymentMethod = async (data: CreatePaymentMethodData): Promise<PaymentMethod> => {
  const response = await API.post('/payment-methods/', data);
  return response.data;
};

// Set a payment method as default
export const setDefaultPaymentMethod = async (paymentMethodId: number): Promise<void> => {
  await API.post(`/payment-methods/${paymentMethodId}/set_default/`);
};

// Deactivate (soft delete) a payment method
export const deactivatePaymentMethod = async (paymentMethodId: number): Promise<void> => {
  await API.post(`/payment-methods/${paymentMethodId}/deactivate/`);
};

// Get default payment method
export const getDefaultPaymentMethod = async (): Promise<PaymentMethod | null> => {
  try {
    const response = await API.get('/payment-methods/');
    const paymentMethods = response.data;
    return paymentMethods.find((method: PaymentMethod) => method.is_default) || null;
  } catch (error) {
    return null;
  }
};
