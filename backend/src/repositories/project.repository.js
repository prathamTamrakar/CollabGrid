import { getDatabase } from '../config/database.js';

export async function findProjectById(projectId) {
  const db = getDatabase();
  let project = await db.projects.findOne({ id: projectId });
  if (!project) {
    project = await db.projects.findOne({ _id: projectId });
  }
  return project;
}

export async function findProjectsByUser(userId) {
  const db = getDatabase();
  return db.projects.find({
    $or: [
      { user_id: userId },
      { collaborators: userId }
    ]
  }).to_list(200);
}

export async function createProject(projectData) {
  const db = getDatabase();
  await db.projects.insertOne(projectData);
  return projectData;
}

export async function updateProject(projectId, updateData) {
  const db = getDatabase();
  return db.projects.updateOne(
    { $or: [{ id: projectId }, { _id: projectId }] },
    { $set: updateData }
  );
}

export async function addCollaborator(projectId, collaboratorId) {
  const db = getDatabase();
  return db.projects.updateOne(
    { $or: [{ id: projectId }, { _id: projectId }] },
    { $addToSet: { collaborators: collaboratorId } }
  );
}

export async function deleteProject(projectId) {
  const db = getDatabase();
  return db.projects.deleteOne({ $or: [{ id: projectId }, { _id: projectId }] });
}

export async function countProjects(filter = {}) {
  const db = getDatabase();
  return db.projects.countDocuments(filter);
}
