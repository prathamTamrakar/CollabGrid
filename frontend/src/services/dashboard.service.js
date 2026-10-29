import api from './api.js';

export async function getStats() {
  const res = await api.get('/dashboard/stats');
  return res.data;
}

export default {
  getStats
};
