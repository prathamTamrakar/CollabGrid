import AppError from '../utils/app-error.js';
import { createInvitationDocument } from '../models/invitation.model.js';
import { createNotificationDocument } from '../models/notification.model.js';
import {
  findInvitationById,
  findExistingInvite,
  findPendingInvitesForUser,
  findProjectInvites,
  createInvitation,
  updateInvitation
} from '../repositories/invitation.repository.js';
import {
  findProjectById,
  addCollaborator,
  findProjectsByUser
} from '../repositories/project.repository.js';
import { findUserById, findUsersByIds } from '../repositories/user.repository.js';
import { createNotification } from '../repositories/notification.repository.js';

export async function sendInvite({ projectId, fromUserId, toUserId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === fromUserId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(fromUserId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to invite to this project', 403);
  }

  const recipient = await findUserById(toUserId);
  if (!recipient) {
    throw new AppError('Recipient user not found', 404);
  }

  if (Array.isArray(project.collaborators) && project.collaborators.includes(toUserId)) {
    throw new AppError('User is already a collaborator on this project', 400);
  }

  const existing = await findExistingInvite({ projectId, toUserId, status: 'pending' });
  if (existing) {
    throw new AppError('Invite already sent', 400);
  }

  const inviteDoc = createInvitationDocument({
    projectId,
    fromUserId,
    toUserId,
    status: 'pending'
  });
  await createInvitation(inviteDoc);

  // Send notification to recipient
  const notifDoc = createNotificationDocument({
    userId: toUserId,
    type: 'invite',
    message: `You have been invited to collaborate on project '${project.name}'`,
    relatedProjectId: projectId
  });
  await createNotification(notifDoc);

  return { message: 'Invite sent' };
}

export async function getPendingInvitesForUser(userId) {
  const invites = await findPendingInvitesForUser(userId);
  const fromIds = [...new Set(invites.map(i => i.from_user_id))];
  const users = await findUsersByIds(fromIds);

  const userMap = new Map();
  for (const u of users) {
    userMap.set(u.id || u._id, u);
  }

  const projectIds = [...new Set(invites.map(i => i.project_id))];
  const projectMap = new Map();
  for (const pid of projectIds) {
    const p = await findProjectById(pid);
    if (p) projectMap.set(p.id || p._id, p);
  }

  return invites.map(inv => {
    const fromUser = userMap.get(inv.from_user_id);
    const project = projectMap.get(inv.project_id);
    return {
      ...inv,
      id: inv.id || inv._id,
      from_user_name: fromUser ? fromUser.name : 'Unknown User',
      from_user_email: fromUser ? fromUser.email : '',
      project_name: project ? project.name : 'Unknown Project'
    };
  });
}

export async function respondToInvite({ inviteId, userId, accept }) {
  const invite = await findInvitationById(inviteId);
  if (!invite) {
    throw new AppError('Invite not found', 404);
  }

  if (invite.to_user_id !== userId) {
    throw new AppError('Not authorized to respond to this invite', 403);
  }

  if (invite.status !== 'pending') {
    throw new AppError(`Invite has already been ${invite.status}`, 400);
  }

  const newStatus = accept ? 'accepted' : 'declined';
  await updateInvitation(inviteId, { status: newStatus });

  if (accept) {
    await addCollaborator(invite.project_id, userId);

    // Notify project owner
    const project = await findProjectById(invite.project_id);
    const responder = await findUserById(userId);
    if (project && responder) {
      await createNotification(createNotificationDocument({
        userId: project.user_id,
        type: 'invite_accepted',
        message: `${responder.name} accepted your invitation to collaborate on '${project.name}'`,
        relatedProjectId: project.id || project._id
      }));
    }
  }

  return { message: `Invite ${newStatus}` };
}

export async function getProjectInvites({ projectId, userId }) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.user_id === userId;
  const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
  if (!isOwner && !isCollaborator) {
    throw new AppError('Not authorized to access project invites', 403);
  }

  const invites = await findProjectInvites(projectId);
  const toIds = [...new Set(invites.map(i => i.to_user_id))];
  const users = await findUsersByIds(toIds);
  const userMap = new Map();
  for (const u of users) {
    userMap.set(u.id || u._id, u);
  }

  return invites.map(inv => {
    const toUser = userMap.get(inv.to_user_id);
    const userName = toUser ? toUser.name : 'Unknown User';
    return {
      ...inv,
      id: inv.id || inv._id,
      to_user_name: userName,
      user_name: userName,
      to_user_email: toUser ? toUser.email : ''
    };
  });
}

export async function getCollaborativeProjects(userId) {
  const allProjects = await findProjectsByUser(userId);

  // Fetch all project owners to populate owner_name
  const ownerIds = [...new Set(allProjects.map(p => p.user_id).filter(Boolean))];
  const owners = await findUsersByIds(ownerIds);
  const ownerMap = new Map();
  for (const o of owners) {
    ownerMap.set(o.id || o._id, o.name);
  }

  return allProjects.map(p => {
    const isOwner = p.user_id === userId;
    const ownerName = ownerMap.get(p.user_id) || (isOwner ? 'You' : 'Team Lead');

    return {
      ...p,
      id: p.id || p._id,
      user_id: p.user_id || userId,
      collaborators: Array.isArray(p.collaborators) ? p.collaborators : [],
      owner_name: ownerName
    };
  });
}

export default {
  sendInvite,
  getPendingInvitesForUser,
  respondToInvite,
  getProjectInvites,
  getCollaborativeProjects
};
