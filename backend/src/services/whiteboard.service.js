import AppError from '../utils/app-error.js';
import { createWhiteboardDocument } from '../models/whiteboard.model.js';
import {
  findWhiteboardByProjectId,
  upsertWhiteboard
} from '../repositories/whiteboard.repository.js';
import { findProjectById } from '../repositories/project.repository.js';

export async function getWhiteboard({ projectId, userId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to access project whiteboard', 403);
  }

  let wb = await findWhiteboardByProjectId(projectId);
  if (!wb) {
    wb = createWhiteboardDocument({ projectId });
    await upsertWhiteboard(projectId, wb);
  }
  return wb;
}

export async function saveWhiteboard({ projectId, userId, data }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to modify project whiteboard', 403);
  }

  const wbDoc = createWhiteboardDocument({ projectId, data });
  await upsertWhiteboard(projectId, wbDoc);
  return { message: 'Whiteboard saved' };
}

export default {
  getWhiteboard,
  saveWhiteboard
};
