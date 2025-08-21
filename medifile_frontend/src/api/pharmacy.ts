import { API } from './client';

export interface Medicine {
  medicine_id: number;
  name: string;
  generic_name: string;
  description: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  category: string;
  price: string;
  original_price?: string;
  stock_quantity: number;
  is_prescription_required: boolean;
  image_url?: string;
}

export interface CartItem {
  cart_item_id: number;
  medicine: Medicine;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_amount: string;
  item_count: number;
}

// Medicine APIs
export const listMedicines = async (params?: { search?: string; category?: string }) => {
  const response = await API.get('/medicines/', { params });
  return response.data;
};

export const getPopularMedicines = async () => {
  const response = await API.get('/medicines/popular/');
  return response.data;
};

export const getSaleMedicines = async () => {
  const response = await API.get('/medicines/on_sale/');
  return response.data;
};

export const getMedicineCategories = async () => {
  const response = await API.get('/medicines/categories/');
  return response.data;
};

export const getMedicineById = async (id: number) => {
  const response = await API.get(`/medicines/${id}/`);
  return response.data;
};

// Cart APIs
export const getMyCart = async (): Promise<Cart> => {
  const response = await API.get('/cart/my_cart/');
  return response.data;
};

export const addToCart = async (medicineId: number, quantity: number) => {
  const response = await API.post('/cart/add_item/', {
    medicine_id: medicineId,
    quantity: quantity,
  });
  return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number) => {
  const response = await API.put('/cart/update_item/', {
    cart_item_id: cartItemId,
    quantity: quantity,
  });
  return response.data;
};

export const removeFromCart = async (cartItemId: number) => {
  const response = await API.delete('/cart/remove_item/', {
    data: { cart_item_id: cartItemId },
  });
  return response.data;
};

export const removeCartItem = async (cartItemId: number) => {
  const response = await API.delete('/cart/remove_item/', {
    data: { cart_item_id: cartItemId },
  });
  return response.data;
};

export const clearCart = async () => {
  const response = await API.delete('/cart/clear_cart/');
  return response.data;
};

// Order APIs
export const createOrder = async (orderData: {
  items: Array<{ medicine_id: number; quantity: number }>;
  shipping_address: string;
  payment_method: string;
  total_amount: string;
}) => {
  const response = await API.post('/orders/create/', orderData);
  return response.data;
};

export const checkout = async (orderData: {
  items: Array<{ medicine_id: number; quantity: number }>;
  shipping_address: any;
  payment_method: string;
  total_amount: string;
  delivery_option?: string;
}) => {
  const response = await API.post('/orders/checkout/', orderData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await API.get('/orders/my_orders/');
  return response.data;
};

export const getOrderById = async (orderId: number) => {
  const response = await API.get(`/orders/${orderId}/`);
  return response.data;
};

export const cancelOrder = async (orderId: number) => {
  const response = await API.post(`/orders/${orderId}/cancel/`);
  return response.data;
};
