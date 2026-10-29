import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const invitationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  project_id: { type: String, required: true, index: true },
  from_user_id: { type: String, required: true },
  to_user_id: { type: String, required: true, index: true },
  status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'declined'], index: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const InvitationModel =
  mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema, 'invites');

export function createInvitationDocument({ id, projectId, fromUserId, toUserId, status = 'pending', createdAt }) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    project_id: projectId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: status || 'pending',
    created_at: createdAt || now
  };
}
