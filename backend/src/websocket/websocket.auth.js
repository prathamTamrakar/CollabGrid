import { verifyAccessToken } from '../utils/token.util.js';
import { findProjectById } from '../repositories/project.repository.js';

export async function authenticateWebSocketUpgrade(request) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const token = url.searchParams.get('token');

  const wbMatch = pathname.match(/^\/api\/ws\/whiteboard\/([^/]+)$/) || pathname.match(/^\/ws\/whiteboard\/([^/]+)$/);
  const chatMatch = pathname.match(/^\/api\/ws\/chat\/([^/]+)$/) || pathname.match(/^\/ws\/chat\/([^/]+)$/);

  if (!wbMatch && !chatMatch) {
    return { error: 404, message: 'Invalid WebSocket path' };
  }

  if (!token) {
    return { error: 401, message: 'Missing authentication token' };
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return { error: 401, message: 'Invalid or expired token' };
  }

  const userId = payload.sub;
  const projectId = wbMatch ? wbMatch[1] : chatMatch[1];

  const project = await findProjectById(projectId);
  if (!project) {
    return { error: 404, message: 'Project not found' };
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    return { error: 403, message: 'Not authorized for this project' };
  }

  return {
    userId,
    projectId,
    isWhiteboard: !!wbMatch
  };
}

export default {
  authenticateWebSocketUpgrade
};
