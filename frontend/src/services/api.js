import axios from 'axios';

export const BACKEND_URL =
  import.meta.env.REACT_APP_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach bearer token dynamically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Synchronize default axios common headers for any direct axios calls
const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;
