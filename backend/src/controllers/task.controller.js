import * as taskService from '../services/task.service.js';
import { success } from '../utils/api-response.js';

export async function getTasks(req, res, next) {
  try {
    const tasks = await taskService.getTasksForUser({
      userId: req.user.id,
      projectId: req.query.project_id,
      status: req.query.status,
      priority: req.query.priority
    });
    return success(res, tasks);
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById({
      taskId: req.params.task_id,
      userId: req.user.id
    });
    return success(res, task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const task = await taskService.createNewTask({
      userId: req.user.id,
      taskData: req.body
    });
    return success(res, task, 200); // 200 preserved for frontend compatibility
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const updated = await taskService.updateExistingTask({
      taskId: req.params.task_id,
      userId: req.user.id,
      updateFields: req.body
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const result = await taskService.removeTask({
      taskId: req.params.task_id,
      userId: req.user.id
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
