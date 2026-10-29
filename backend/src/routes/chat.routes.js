import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// GET /api/chat/:project_id
router.get('/:project_id', requireAuth, chatController.getChatMessages);

// POST /api/chat/:project_id/send
router.post('/:project_id/send', requireAuth, chatController.sendChatMessage);

// PUT /api/chat/:project_id/edit/:msg_id
router.put('/:project_id/edit/:msg_id', requireAuth, chatController.editChatMessage);

// DELETE /api/chat/:project_id/delete/:msg_id
router.delete('/:project_id/delete/:msg_id', requireAuth, chatController.deleteChatMessage);

// POST /api/chat/:project_id/upload
router.post('/:project_id/upload', requireAuth, upload.single('file'), chatController.uploadChatFile);

export default router;
