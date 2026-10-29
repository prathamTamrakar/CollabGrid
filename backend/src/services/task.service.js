import AppError from '../utils/app-error.js';
import { createTaskDocument } from '../models/task.model.js';
import {
  findTaskById,
  findTasks,
  createTask,
  updateTask,
  deleteTask
} from '../repositories/task.repository.js';
import { findProjectById } from '../repositories/project.repository.js';

export async function getTasksForUser({ userId, projectId, status, priority }) {
  let filter = {};

  if (projectId) {
    const project = await findProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    const isOwner = project.user_id === userId;
    const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
    if (!isOwner && !isCollaborator) {
      throw new AppError('Not authorized to access project tasks', 403);
    }
    filter.project_id = projectId;
  } else {
    filter = {
      $or: [
        { user_id: userId },
        { project_id: { $ne: null } }
      ]
    };
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await findTasks(filter, 'position', 1);

  // Normalize id property
  return tasks.map(t => ({
    ...t,
    id: t.id || t._id
  }));
}

export async function getTaskById({ taskId, userId }) {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Authorization check: task creator or project collaborator
  if (task.user_id !== userId) {
    if (task.project_id) {
      const project = await findProjectById(task.project_id);
      const isCollaborator = project && Array.isArray(project.collaborators) && project.collaborators.includes(userId);
      const isProjectOwner = project && project.user_id === userId;
      if (!isCollaborator && !isProjectOwner) {
        throw new AppError('Not authorized to view this task', 403);
      }
    } else {
      throw new AppError('Not authorized to view this task', 403);
    }
  }

  task.id = task.id || task._id;
  return task;
}

export async function createNewTask({ userId, taskData }) {
  const { title, description, status, priority, due_date, project_id, position } = taskData;

  if (project_id) {
    const project = await findProjectById(project_id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    const isOwner = project.user_id === userId;
    const isCollaborator = Array.isArray(project.collaborators) && project.collaborators.includes(userId);
    if (!isOwner && !isCollaborator) {
      throw new AppError('Not authorized to create tasks in this project', 403);
    }
  }

  const doc = createTaskDocument({
    title,
    description,
    status,
    priority,
    dueDate: due_date,
    userId,
    projectId: project_id,
    position
  });

  await createTask(doc);
  return doc;
}

export async function updateExistingTask({ taskId, userId, updateFields }) {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check authorization
  if (task.user_id !== userId) {
    if (task.project_id) {
      const project = await findProjectById(task.project_id);
      const isCollaborator = project && Array.isArray(project.collaborators) && project.collaborators.includes(userId);
      const isProjectOwner = project && project.user_id === userId;
      if (!isCollaborator && !isProjectOwner) {
        throw new AppError('Not authorized to update this task', 403);
      }
    } else {
      throw new AppError('Not authorized to update this task', 403);
    }
  }

  const cleanUpdates = {};
  const allowed = ['title', 'description', 'status', 'priority', 'due_date', 'project_id', 'position'];
  for (const field of allowed) {
    if (field in updateFields) {
      cleanUpdates[field] = updateFields[field];
    }
  }
  cleanUpdates.updated_at = new Date().toISOString();

  await updateTask(taskId, cleanUpdates);

  const updated = await findTaskById(taskId);
  updated.id = updated.id || updated._id;
  return updated;
}

export async function removeTask({ taskId, userId }) {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.user_id !== userId) {
    if (task.project_id) {
      const project = await findProjectById(task.project_id);
      const isProjectOwner = project && project.user_id === userId;
      if (!isProjectOwner) {
        throw new AppError('Only task creator or project owner can delete this task', 403);
      }
    } else {
      throw new AppError('Not authorized to delete this task', 403);
    }
  }

  await deleteTask(taskId);
  return { message: 'Task deleted successfully' };
}

export default {
  getTasksForUser,
  getTaskById,
  createNewTask,
  updateExistingTask,
  removeTask
};
