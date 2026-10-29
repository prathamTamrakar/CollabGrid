import AppError from '../utils/app-error.js';
import { createProjectDocument } from '../models/project.model.js';
import {
  findProjectById,
  findProjectsByUser,
  createProject,
  updateProject,
  deleteProject
} from '../repositories/project.repository.js';
import { findUsersByIds } from '../repositories/user.repository.js';

export async function getProjectsForUser(userId) {
  const projects = await findProjectsByUser(userId);
  return projects.map(p => ({
    ...p,
    id: p.id || p._id
  }));
}

export async function getProjectById({ projectId, userId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to access this project', 403);
  }

  project.id = project.id || project._id;
  return project;
}

export async function createNewProject({ userId, projectData }) {
  const { name, description, color } = projectData;

  const doc = createProjectDocument({
    name,
    description,
    color,
    userId,
    collaborators: [userId] // owner is also an initial collaborator
  });

  await createProject(doc);
  return doc;
}

export async function updateExistingProject({ projectId, userId, updateFields }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to update this project', 403);
  }

  const cleanUpdates = {};
  if ('name' in updateFields) cleanUpdates.name = updateFields.name.trim();
  if ('description' in updateFields) cleanUpdates.description = updateFields.description.trim();
  if ('color' in updateFields) cleanUpdates.color = updateFields.color;
  cleanUpdates.updated_at = new Date().toISOString();

  await updateProject(projectId, cleanUpdates);

  const updated = await findProjectById(projectId);
  updated.id = updated.id || updated._id;
  return updated;
}

export async function removeProject({ projectId, userId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.user_id !== userId) {
    throw new AppError('Only the project owner can delete this project', 403);
  }

  await deleteProject(projectId);
  return { message: 'Project deleted successfully' };
}

export async function getProjectCollaborators({ projectId, userId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to access project collaborators', 403);
  }

  const collaboratorIds = Array.isArray(project.collaborators) ? project.collaborators : [];
  const users = await findUsersByIds(collaboratorIds);

  return users.map(u => ({
    id: u.id || u._id,
    name: u.name,
    email: u.email
  }));
}

export default {
  getProjectsForUser,
  getProjectById,
  createNewProject,
  updateExistingProject,
  removeProject,
  getProjectCollaborators
};
