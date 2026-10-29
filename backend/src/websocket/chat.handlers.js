import {
  addChatConnection,
  removeChatConnection,
  broadcastToChat
} from './connection.manager.js';
import {
  createChatMessage,
  findChatMessageById,
  updateChatMessage
} from '../repositories/chat.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { createChatMessageDocument } from '../models/chat.model.js';

export function handleChatConnect(projectId, ws) {
  addChatConnection(projectId, ws);
}

export function handleChatDisconnect(projectId, ws) {
  removeChatConnection(projectId, ws);
}

export async function handleChatMessage(projectId, userId, data) {
  try {
    const raw = data.toString();
    const msg = JSON.parse(raw);

    if (['text', 'file', 'voice'].includes(msg.type)) {
      const user = await findUserById(userId);
      const chatMsg = createChatMessageDocument({
        projectId,
        userId,
        userName: user ? user.name : 'Unknown',
        type: msg.type,
        content: msg.content || '',
        fileName: msg.file_name || null
      });

      await createChatMessage(chatMsg);
      broadcastToChat(projectId, JSON.stringify({ type: 'message', message: chatMsg }));
    } else if (msg.type === 'edit') {
      const chatMsg = await findChatMessageById(msg.id);
      if (chatMsg && chatMsg.project_id === projectId && chatMsg.user_id === userId) {
        const now = new Date().toISOString();
        await updateChatMessage(msg.id, { content: msg.content, edited: true, updated_at: now });
        broadcastToChat(projectId, JSON.stringify({ type: 'edit', id: msg.id, content: msg.content }));
      }
    } else if (msg.type === 'delete') {
      const chatMsg = await findChatMessageById(msg.id);
      if (chatMsg && chatMsg.project_id === projectId && chatMsg.user_id === userId) {
        const now = new Date().toISOString();
        await updateChatMessage(msg.id, { deleted: true, content: '', updated_at: now });
        broadcastToChat(projectId, JSON.stringify({ type: 'delete', id: msg.id }));
      }
    }
  } catch (err) {
    console.error('[WS] Chat message parse error:', err);
  }
}

export default {
  handleChatConnect,
  handleChatDisconnect,
  handleChatMessage
};
