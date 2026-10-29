import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const projectSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#4f46e5' },
  user_id: { type: String, required: true, index: true },
  collaborators: { type: [String], default: [] },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema, 'projects');

export function createProjectDocument({
  id, name, description = '', color = '#4f46e5', userId, collaborators = [], createdAt, updatedAt
}) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    name: name ? name.trim() : '',
    description: description ? description.trim() : '',
    color: color || '#4f46e5',
    user_id: userId,
    collaborators: Array.isArray(collaborators) ? collaborators : [],
    created_at: createdAt || now,
    updated_at: updatedAt || now
  };
}
