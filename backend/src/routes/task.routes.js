import express from 'express';
import * as taskController from '../controllers/task.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { validateCreateTask, validateUpdateTask } from '../validators/task.validator.js';

const router = express.Router();

// POST /api/tasks
router.post('/', requireAuth, validate(validateCreateTask), taskController.createTask);

// GET /api/tasks
router.get('/', requireAuth, taskController.getTasks);

// GET /api/tasks/:task_id
router.get('/:task_id', requireAuth, taskController.getTaskById);

// PUT /api/tasks/:task_id
router.put('/:task_id', requireAuth, validate(validateUpdateTask), taskController.updateTask);

// DELETE /api/tasks/:task_id
router.delete('/:task_id', requireAuth, taskController.deleteTask);

export default router;
