import { getDatabase } from '../config/database.js';

export async function findInvitationById(inviteId) {
  const db = getDatabase();
  let invite = await db.invites.findOne({ id: inviteId });
  if (!invite) {
    invite = await db.invites.findOne({ _id: inviteId });
  }
  return invite;
}

export async function findExistingInvite({ projectId, toUserId, status = 'pending' }) {
  const db = getDatabase();
  return db.invites.findOne({ project_id: projectId, to_user_id: toUserId, status });
}

export async function findPendingInvitesForUser(userId) {
  const db = getDatabase();
  return db.invites.find({ to_user_id: userId, status: 'pending' }).to_list(100);
}

export async function findProjectInvites(projectId) {
  const db = getDatabase();
  return db.invites.find({ project_id: projectId }).to_list(100);
}

export async function createInvitation(inviteData) {
  const db = getDatabase();
  await db.invites.insertOne(inviteData);
  return inviteData;
}

export async function updateInvitation(inviteId, updateData) {
  const db = getDatabase();
  return db.invites.updateOne(
    { $or: [{ id: inviteId }, { _id: inviteId }] },
    { $set: updateData }
  );
}

export async function countInvitations(filter = {}) {
  const db = getDatabase();
  return db.invites.countDocuments(filter);
}
