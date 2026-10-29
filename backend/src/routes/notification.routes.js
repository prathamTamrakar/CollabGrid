import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/notifications
router.get('/', requireAuth, notificationController.getNotifications);

// POST /api/notifications/:notif_id/read
router.post('/:notif_id/read', requireAuth, notificationController.markNotificationAsRead);

// DELETE /api/notifications/read/all
router.delete('/read/all', requireAuth, notificationController.deleteAllReadNotifications);

// DELETE /api/notifications/:notif_id
router.delete('/:notif_id', requireAuth, notificationController.deleteNotification);

export default router;
