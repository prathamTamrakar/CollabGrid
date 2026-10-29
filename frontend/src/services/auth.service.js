import api from './api.js';

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function register(name, email, password) {
  const res = await api.post('/auth/register', { name, email, password });
  return res.data;
}

export async function requestForgotPassword(email) {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
}

export async function verifyOtp(email, otp, otp_token) {
  const res = await api.post('/auth/verify-otp', { email, otp, otp_token });
  return res.data;
}

export async function resetPassword({ email, otp_token, new_password }) {
  const res = await api.post('/auth/reset-password', { email, otp_token, new_password });
  return res.data;
}

export default {
  getMe,
  login,
  register,
  requestForgotPassword,
  verifyOtp,
  resetPassword
};
