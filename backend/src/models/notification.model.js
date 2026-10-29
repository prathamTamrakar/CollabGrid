import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const notificationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  type: { type: String, default: 'info' },
  message: { type: String, required: true },
  related_project_id: { type: String, default: null },
  status: { type: String, default: 'unread', enum: ['unread', 'read'], index: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema, 'notifications');

export function createNotificationDocument({
  id, userId, type = 'info', message, relatedProjectId = null, status = 'unread', createdAt
}) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    user_id: userId,
    type,
    message: message || '',
    related_project_id: relatedProjectId || null,
    status: status || 'unread',
    created_at: createdAt || now
  };
}
