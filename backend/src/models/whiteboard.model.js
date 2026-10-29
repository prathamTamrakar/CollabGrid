import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  project_id: { type: String, required: true, unique: true, index: true },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ actions: [], bgColor: '#ffffff' })
  },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const WhiteboardModel =
  mongoose.models.Whiteboard || mongoose.model('Whiteboard', whiteboardSchema, 'whiteboards');

export function createWhiteboardDocument({ projectId, data, updatedAt }) {
  const now = new Date().toISOString();
  let cleanData = data;
  if (!cleanData) {
    cleanData = { actions: [], bgColor: '#ffffff' };
  } else if (Array.isArray(cleanData)) {
    cleanData = { actions: cleanData, bgColor: '#ffffff' };
  } else if (typeof cleanData === 'object' && !Array.isArray(cleanData.actions)) {
    cleanData = { actions: [], bgColor: cleanData.bgColor || '#ffffff' };
  }
  return {
    project_id: projectId,
    data: cleanData,
    updated_at: updatedAt || now
  };
}
