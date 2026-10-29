import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/users/search
router.get('/search', requireAuth, userController.searchUsers);

// GET /api/users/profile
router.get('/profile', requireAuth, userController.getProfile);

export default router;
