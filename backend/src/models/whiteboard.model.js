import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  project_id: { type: String, required: true, unique: true, index: true },
  data: {
    actions: { type: Array, default: [] },
    bgColor: { type: String, default: '#ffffff' }
  },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const WhiteboardModel =
  mongoose.models.Whiteboard || mongoose.model('Whiteboard', whiteboardSchema, 'whiteboards');

export function createWhiteboardDocument({ projectId, data = { actions: [], bgColor: '#ffffff' }, updatedAt }) {
  const now = new Date().toISOString();
  return {
    project_id: projectId,
    data: data || { actions: [], bgColor: '#ffffff' },
    updated_at: updatedAt || now
  };
}
