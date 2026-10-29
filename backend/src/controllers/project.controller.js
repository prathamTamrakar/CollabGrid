import * as projectService from '../services/project.service.js';
import { success } from '../utils/api-response.js';

export async function getProjects(req, res, next) {
  try {
    const projects = await projectService.getProjectsForUser(req.user.id);
    return success(res, projects);
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, project);
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const project = await projectService.createNewProject({
      userId: req.user.id,
      projectData: req.body
    });
    return success(res, project, 200);
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const updated = await projectService.updateExistingProject({
      projectId: req.params.project_id,
      userId: req.user.id,
      updateFields: req.body
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const result = await projectService.removeProject({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getProjectCollaborators(req, res, next) {
  try {
    const collaborators = await projectService.getProjectCollaborators({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, collaborators);
  } catch (err) {
    next(err);
  }
}

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectCollaborators
};
