import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const taskSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'todo', enum: ['todo', 'in_progress', 'done'], index: true },
  priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high'], index: true },
  due_date: { type: String, default: null },
  user_id: { type: String, required: true, index: true },
  project_id: { type: String, default: null, index: true },
  position: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const TaskModel = mongoose.models.Task || mongoose.model('Task', taskSchema, 'tasks');

export function createTaskDocument({
  id, title, description = '', status = 'todo', priority = 'medium',
  dueDate = null, userId, projectId = null, position = 0, createdAt, updatedAt
}) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    title: title ? title.trim() : '',
    description: description ? description.trim() : '',
    status: status || 'todo',
    priority: priority || 'medium',
    due_date: dueDate || null,
    user_id: userId,
    project_id: projectId || null,
    position: typeof position === 'number' ? position : 0,
    created_at: createdAt || now,
    updated_at: updatedAt || now
  };
}
