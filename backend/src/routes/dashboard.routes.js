import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, dashboardController.getStats);

export default router;
