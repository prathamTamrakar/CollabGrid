import api from './api.js';

export async function getTasks(params = {}) {
  const res = await api.get('/tasks', { params });
  return res.data;
}

export async function getTaskById(taskId) {
  const res = await api.get(`/tasks/${taskId}`);
  return res.data;
}

export async function createTask(taskData) {
  const res = await api.post('/tasks', taskData);
  return res.data;
}

export async function updateTask(taskId, taskData) {
  const res = await api.put(`/tasks/${taskId}`, taskData);
  return res.data;
}

export async function deleteTask(taskId) {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
