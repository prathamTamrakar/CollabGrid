import axios from 'axios';

const rawBackendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.REACT_APP_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

// Strip any trailing slash so ${BACKEND_URL}/api is always well-formed
export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

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
