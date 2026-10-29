import AppError from '../utils/app-error.js';
import { createChatMessageDocument } from '../models/chat.model.js';
import {
  findChatMessageById,
  findMessagesByProject,
  createChatMessage,
  updateChatMessage
} from '../repositories/chat.repository.js';
import { findProjectById } from '../repositories/project.repository.js';

export async function getProjectMessages({ projectId, userId, limit = 100 }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to access project chat', 403);
  }

  const messages = await findMessagesByProject(projectId, limit);
  return messages.map(m => ({
    ...m,
    id: m.id || m._id
  }));
}

export async function sendChatMessage({ projectId, user, type = 'text', content = '', fileName = null }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === user.id;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(user.id);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to post messages in this project', 403);
  }

  const chatMsg = createChatMessageDocument({
    projectId,
    userId: user.id,
    userName: user.name || 'Unknown',
    type,
    content,
    fileName
  });

  await createChatMessage(chatMsg);
  return chatMsg;
}

export async function editChatMessage({ projectId, msgId, userId, content }) {
  const msg = await findChatMessageById(msgId);
  if (!msg) {
    throw new AppError('Message not found', 404);
  }
  if (msg.project_id !== projectId) {
    throw new AppError('Message does not belong to this project', 400);
  }
  if (msg.user_id !== userId) {
    throw new AppError('Not authorized to edit this message', 403);
  }

  const now = new Date().toISOString();
  await updateChatMessage(msgId, {
    content,
    edited: true,
    updated_at: now
  });

  return { message: 'Message edited' };
}

export async function deleteChatMessage({ projectId, msgId, userId }) {
  const msg = await findChatMessageById(msgId);
  if (!msg) {
    throw new AppError('Message not found', 404);
  }
  if (msg.project_id !== projectId) {
    throw new AppError('Message does not belong to this project', 400);
  }
  if (msg.user_id !== userId) {
    throw new AppError('Not authorized to delete this message', 403);
  }

  const now = new Date().toISOString();
  await updateChatMessage(msgId, {
    deleted: true,
    content: '',
    updated_at: now
  });

  return { message: 'Message deleted' };
}

export default {
  getProjectMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage
};
