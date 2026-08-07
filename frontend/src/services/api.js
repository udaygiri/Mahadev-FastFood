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

// --- MENU API ENDPOINTS ---

/**
 * Fetch menu items (pass availableOnly = true for customer view)
 * @param {boolean} availableOnly 
 */
export const getMenuItems = async (availableOnly = false) => {
  const response = await api.get(`/menu`, {
    params: { available_only: availableOnly }
  });
  return response.data;
};

/**
 * Create a new menu item (Admin only)
 * @param {Object} itemData 
 */
export const createMenuItem = async (itemData) => {
  const response = await api.post('/menu', itemData);
  return response.data;
};

/**
 * Update existing menu item / toggle availability (Admin only)
 * @param {number} id 
 * @param {Object} updateData 
 */
export const updateMenuItem = async (id, updateData) => {
  const response = await api.put(`/menu/${id}`, updateData);
  return response.data;
};

/**
 * Delete a menu item (Admin only)
 * @param {number} id 
 */
export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data;
};

export default api;
