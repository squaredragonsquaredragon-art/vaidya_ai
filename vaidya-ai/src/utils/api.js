import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach JWT token and language preference to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vaidya_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem('vaidya_lang') || 'en';
    config.headers['Accept-Language'] = lang;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vaidya_token');
      localStorage.removeItem('vaidya_user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// --- AI Chat ---
export const chatAPI = {
  analyzeSymptoms: (text) => api.post('/chat/symptoms', { text }),
  analyzeMedicine: (name) => api.post('/chat/medicine', { name }),
  analyzeDisease: (name) => api.post('/chat/disease', { name }),
  analyzeImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/image-diagnosis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyzeTabletImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/tablet-scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// --- Medical Records ---
export const recordsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/records/'),
  delete: (id) => api.delete(`/records/${id}`),
  getDownloadUrl: (id) => `${API_BASE_URL}/records/${id}/download`,
};

// --- Health Profile ---
export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.put('/profile/', data),
};

export default api;
