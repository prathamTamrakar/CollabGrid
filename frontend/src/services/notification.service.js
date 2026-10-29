import api from './api.js';

export async function getNotifications() {
  const res = await api.get('/notifications');
  return res.data;
}

export async function markAsRead(notifId) {
  const res = await api.post(`/notifications/${notifId}/read`);
  return res.data;
}

export async function deleteNotification(notifId) {
  const res = await api.delete(`/notifications/${notifId}`);
  return res.data;
}

export async function deleteAllRead() {
  const res = await api.delete('/notifications/read/all');
  return res.data;
}

export default {
  getNotifications,
  markAsRead,
  deleteNotification,
  deleteAllRead
};
