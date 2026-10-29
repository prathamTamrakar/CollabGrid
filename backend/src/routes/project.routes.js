import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import * as invitationController from '../controllers/invitation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { validateCreateProject, validateProjectInvite } from '../validators/project.validator.js';

const router = express.Router();

// POST /api/projects
router.post('/', requireAuth, validate(validateCreateProject), projectController.createProject);

// GET /api/projects
router.get('/', requireAuth, projectController.getProjects);

// GET /api/projects/:project_id
router.get('/:project_id', requireAuth, projectController.getProjectById);

// PUT /api/projects/:project_id
router.put('/:project_id', requireAuth, projectController.updateProject);

// DELETE /api/projects/:project_id
router.delete('/:project_id', requireAuth, projectController.deleteProject);

// POST /api/projects/:project_id/invite
router.post('/:project_id/invite', requireAuth, validate(validateProjectInvite), invitationController.inviteCollaborator);

// GET /api/projects/:project_id/invites
router.get('/:project_id/invites', requireAuth, invitationController.getProjectInvites);

// GET /api/projects/:project_id/collaborators
router.get('/:project_id/collaborators', requireAuth, projectController.getProjectCollaborators);

export default router;
