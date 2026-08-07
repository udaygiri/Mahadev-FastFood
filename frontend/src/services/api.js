import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a new order to the backend API
 * @param {Object} orderData - Order payload matching backend Pydantic schema
 */
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

/**
 * Fetch orders from backend API (optionally filtered by customer phone)
 * @param {string} [phone] - Optional phone number to filter orders
 */
export const fetchOrders = async (phone) => {
  const response = await api.get('/orders', {
    params: phone ? { phone } : {},
  });
  return response.data;
};

/**
 * Update order status by order ID
 * @param {number} orderId 
 * @param {string} status 
 */
export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

/**
 * Delete an order by order ID
 * @param {string} orderId 
 */
export const deleteOrder = async (orderId) => {
  const response = await api.delete(`/orders/${orderId}`);
  return response.data;
};

export default api;
