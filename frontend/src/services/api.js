import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Socket.io client (connects after login when the auth token is set)
const socket = io(API_URL.replace(/\/api$/, ''), {
  autoConnect: false,
  transports: ['websocket'],
});

// ---- Auth services ----
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    socket.disconnect();
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

// ---- Meal services ----
export const mealService = {
  getMeals: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.lat) params.append('lat', filters.lat);
    if (filters.lng) params.append('lng', filters.lng);
    if (filters.radius) params.append('radius', filters.radius);
    if (filters.cuisineType) params.append('cuisineType', filters.cuisineType);
    if (filters.dietary) params.append('dietary', filters.dietary);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.availableNow) params.append('availableNow', 'true');
    const response = await api.get(`/meals?${params.toString()}`);
    return response.data;
  },
  getMeal: async (id) => {
    const response = await api.get(`/meals/${id}`);
    return response.data;
  },
  createMeal: async (mealData) => {
    const response = await api.post('/meals', mealData);
    return response.data;
  },
  updateMeal: async (id, mealData) => {
    const response = await api.put(`/meals/${id}`, mealData);
    return response.data;
  },
  deleteMeal: async (id) => {
    const response = await api.delete(`/meals/${id}`);
    return response.data;
  },
  getMealsByCook: async (cookId) => {
    const response = await api.get(`/meals/cook/${cookId}`);
    return response.data;
  },
};

// ---- Order services ----
export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },
  getCookOrders: async () => {
    const response = await api.get('/orders/cook-orders');
    return response.data;
  },
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
  leaveReview: async (id, review) => {
    const response = await api.post(`/orders/${id}/review`, review);
    return response.data;
  },
};

// ---- Chat services ----
export const chatService = {
  socket,
  getOrCreatePrivateChat: async (cookId) => {
    const response = await api.post(`/chat/private/${cookId}`);
    return response.data;
  },
  getAllChefsChannel: async () => {
    const response = await api.post('/chat/all-chefs');
    return response.data;
  },
  getMyConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },
  getMessages: async (conversationId) => {
    const response = await api.get(`/chat/${conversationId}/messages`);
    return response.data;
  },
  getChefs: async () => {
    const response = await api.get('/chat/chefs');
    return response.data;
  },
};

// ---- Meal plan services ----
export const mealPlanService = {
  getMealPlans: async () => {
    const response = await api.get('/meal-plans');
    return response.data;
  },
  getMealPlan: async (id) => {
    const response = await api.get(`/meal-plans/${id}`);
    return response.data;
  },
  createMealPlan: async (planData) => {
    const response = await api.post('/meal-plans', planData);
    return response.data;
  },
  updateMealPlan: async (id, planData) => {
    const response = await api.put(`/meal-plans/${id}`, planData);
    return response.data;
  },
  deleteMealPlan: async (id) => {
    const response = await api.delete(`/meal-plans/${id}`);
    return response.data;
  },
  subscribe: async (id, weeksCommitted) => {
    const response = await api.post(`/meal-plans/${id}/subscribe`, { weeksCommitted });
    return response.data;
  },
  unsubscribe: async (id) => {
    const response = await api.post(`/meal-plans/${id}/unsubscribe`);
    return response.data;
  },
  getMySubscriptions: async () => {
    const response = await api.get('/meal-plans/subscriptions/my');
    return response.data;
  },
};

// ---- Buyer request services ----
export const requestService = {
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.cuisineType) params.append('cuisineType', filters.cuisineType);
    if (filters.dietary) params.append('dietary', filters.dietary);
    const response = await api.get(`/requests?${params.toString()}`);
    return response.data;
  },
  getRequest: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },
  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },
  respondToRequest: async (id, { message, mealListingId }) => {
    const response = await api.post(`/requests/${id}/respond`, { message, mealListingId });
    return response.data;
  },
  getMyRequests: async () => {
    const response = await api.get('/requests/my');
    return response.data;
  },
  cancelRequest: async (id) => {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
  },
};

// ---- Admin services ----
export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  getAllConversations: async () => {
    const response = await api.get('/admin/chats');
    return response.data;
  },
  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/admin/chats/${conversationId}`);
    return response.data;
  },
};

export default api;
