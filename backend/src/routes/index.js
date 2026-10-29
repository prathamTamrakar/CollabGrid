import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import taskRoutes from './task.routes.js';
import projectRoutes from './project.routes.js';
import invitationRoutes from './invitation.routes.js';
import notificationRoutes from './notification.routes.js';
import whiteboardRoutes from './whiteboard.routes.js';
import chatRoutes from './chat.routes.js';
import calendarRoutes from './calendar.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/notifications', notificationRoutes);
router.use('/whiteboard', whiteboardRoutes);
router.use('/chat', chatRoutes);
router.use('/calendar', calendarRoutes);
router.use('/dashboard', dashboardRoutes);

// Mount collaboration & invitation endpoints
router.use('/', invitationRoutes);

export default router;
