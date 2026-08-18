import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8000/api`;
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
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
 * Update order status by order ID (accepts optional driver_name and driver_phone)
 * @param {string} orderId 
 * @param {string} status 
 * @param {Object} [extraData] 
 */
export const updateOrderStatus = async (orderId, status, extraData = {}) => {
  const response = await api.patch(`/orders/${orderId}/status`, {
    status,
    ...extraData
  });
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

// --- SETTINGS & CATEGORIES API ENDPOINTS ---

/**
 * Fetch list of category objects from backend
 */
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

/**
 * Add a new category (Admin only)
 * @param {string} name 
 */
export const createCategory = async (name) => {
  const response = await api.post('/categories', { name });
  return response.data;
};

/**
 * Delete a category by ID (Admin only)
 * @param {number} id 
 */
export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

/**
 * Fetch app settings (platform_charge, delivery_fee, is_store_open)
 */
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

/**
 * Update app settings (Admin only)
 * @param {Object} settingsData 
 */
export const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

export default api;

