import api from './api.js';

export async function sendInvite(projectId, userId) {
  const res = await api.post('/collaboration/invite', { project_id: projectId, user_id: userId });
  return res.data;
}

export async function getPendingInvites() {
  const res = await api.get('/collaboration/invites');
  return res.data;
}

export async function acceptInvite(inviteId) {
  const res = await api.post(`/collaboration/invite/${inviteId}/accept`);
  return res.data;
}

export async function declineInvite(inviteId) {
  const res = await api.post(`/collaboration/invite/${inviteId}/decline`);
  return res.data;
}

export async function getCollaborativeProjects() {
  const res = await api.get('/collaboration/projects');
  return res.data;
}

export async function searchUsers(query) {
  const res = await api.get('/users/search', { params: { query } });
  return res.data;
}

export default {
  sendInvite,
  getPendingInvites,
  acceptInvite,
  declineInvite,
  getCollaborativeProjects,
  searchUsers
};
