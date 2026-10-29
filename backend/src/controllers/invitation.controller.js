import * as invitationService from '../services/invitation.service.js';
import { success } from '../utils/api-response.js';

export async function inviteCollaborator(req, res, next) {
  try {
    const projectId = req.params.project_id || req.body.project_id;
    const toUserId = req.body.user_id || req.body.to_user_id || req.query.to_user_id;

    const result = await invitationService.sendInvite({
      projectId,
      fromUserId: req.user.id,
      toUserId
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getPendingInvites(req, res, next) {
  try {
    const invites = await invitationService.getPendingInvitesForUser(req.user.id);
    return success(res, invites);
  } catch (err) {
    next(err);
  }
}

export async function acceptInvite(req, res, next) {
  try {
    const result = await invitationService.respondToInvite({
      inviteId: req.params.invite_id,
      userId: req.user.id,
      accept: true
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function declineInvite(req, res, next) {
  try {
    const result = await invitationService.respondToInvite({
      inviteId: req.params.invite_id,
      userId: req.user.id,
      accept: false
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function respondToInvite(req, res, next) {
  try {
    const accept = req.body.accept !== false && req.body.response !== 'decline';
    const result = await invitationService.respondToInvite({
      inviteId: req.params.invite_id,
      userId: req.user.id,
      accept
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getProjectInvites(req, res, next) {
  try {
    const invites = await invitationService.getProjectInvites({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, invites);
  } catch (err) {
    next(err);
  }
}

export async function getCollaborativeProjects(req, res, next) {
  try {
    const projects = await invitationService.getCollaborativeProjects(req.user.id);
    return success(res, projects);
  } catch (err) {
    next(err);
  }
}

export default {
  inviteCollaborator,
  getPendingInvites,
  acceptInvite,
  declineInvite,
  respondToInvite,
  getProjectInvites,
  getCollaborativeProjects
};
