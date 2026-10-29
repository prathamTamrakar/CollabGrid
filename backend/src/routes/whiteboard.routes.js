import express from 'express';
import * as whiteboardController from '../controllers/whiteboard.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/whiteboard/:project_id
router.get('/:project_id', requireAuth, whiteboardController.getWhiteboard);

// POST /api/whiteboard/:project_id
router.post('/:project_id', requireAuth, whiteboardController.saveWhiteboard);

export default router;
