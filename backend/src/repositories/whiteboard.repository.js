import { getDatabase } from '../config/database.js';

export async function findWhiteboardByProjectId(projectId) {
  const db = getDatabase();
  return db.whiteboards.findOne({ project_id: projectId });
}

export async function upsertWhiteboard(projectId, whiteboardData) {
  const db = getDatabase();
  return db.whiteboards.updateOne(
    { project_id: projectId },
    { $set: whiteboardData },
    { upsert: true }
  );
}
