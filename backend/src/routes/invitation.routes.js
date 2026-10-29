import express from 'express';
import * as invitationController from '../controllers/invitation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { validateProjectInvite } from '../validators/project.validator.js';

const router = express.Router();

// POST /api/collaboration/invite
router.post('/collaboration/invite', requireAuth, validate(validateProjectInvite), invitationController.inviteCollaborator);

// GET /api/collaboration/invites
router.get('/collaboration/invites', requireAuth, invitationController.getPendingInvites);

// POST /api/collaboration/invite/:invite_id/accept
router.post('/collaboration/invite/:invite_id/accept', requireAuth, invitationController.acceptInvite);

// POST /api/collaboration/invite/:invite_id/decline
router.post('/collaboration/invite/:invite_id/decline', requireAuth, invitationController.declineInvite);

// POST /api/invites/:invite_id/respond
router.post('/invites/:invite_id/respond', requireAuth, invitationController.respondToInvite);

// GET /api/collaboration/projects
router.get('/collaboration/projects', requireAuth, invitationController.getCollaborativeProjects);

export default router;
