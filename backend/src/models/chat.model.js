import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const chatMessageSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  project_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  user_name: { type: String, default: 'Unknown' },
  type: { type: String, default: 'text', enum: ['text', 'file', 'voice'] },
  content: { type: String, default: '' },
  file_name: { type: String, default: null },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const ChatMessageModel =
  mongoose.models.ChatMessage ||
  mongoose.model('ChatMessage', chatMessageSchema, 'project_chat_messages');

export function createChatMessageDocument({
  id, projectId, userId, userName = 'Unknown', type = 'text',
  content = '', fileName = null, createdAt, updatedAt, edited = false, deleted = false
}) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    project_id: projectId,
    user_id: userId,
    user_name: userName,
    type,
    content: content || '',
    file_name: fileName || null,
    created_at: createdAt || now,
    updated_at: updatedAt || now,
    edited: !!edited,
    deleted: !!deleted
  };
}
