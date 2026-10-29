import api from './api.js';

export async function getProjects() {
  const res = await api.get('/projects');
  return res.data;
}

export async function getProjectById(projectId) {
  const res = await api.get(`/projects/${projectId}`);
  return res.data;
}

export async function createProject(projectData) {
  const res = await api.post('/projects', projectData);
  return res.data;
}

export async function updateProject(projectId, projectData) {
  const res = await api.put(`/projects/${projectId}`, projectData);
  return res.data;
}

export async function deleteProject(projectId) {
  const res = await api.delete(`/projects/${projectId}`);
  return res.data;
}

export async function getProjectCollaborators(projectId) {
  const res = await api.get(`/projects/${projectId}/collaborators`);
  return res.data;
}

export async function inviteCollaborator(projectId, data) {
  const res = await api.post(`/projects/${projectId}/invite`, data);
  return res.data;
}

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectCollaborators,
  inviteCollaborator
};
