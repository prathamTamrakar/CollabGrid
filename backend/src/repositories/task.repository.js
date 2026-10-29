import { getDatabase } from '../config/database.js';

export async function findTaskById(taskId) {
  const db = getDatabase();
  let task = await db.tasks.findOne({ id: taskId });
  if (!task) {
    task = await db.tasks.findOne({ _id: taskId });
  }
  return task;
}

export async function findTasks(filter = {}, sortField = 'position', sortOrder = 1) {
  const db = getDatabase();
  return db.tasks.find(filter).sort(sortField, sortOrder).to_list(1000);
}

export async function createTask(taskData) {
  const db = getDatabase();
  await db.tasks.insertOne(taskData);
  return taskData;
}

export async function updateTask(taskId, updateData) {
  const db = getDatabase();
  return db.tasks.updateOne(
    { $or: [{ id: taskId }, { _id: taskId }] },
    { $set: updateData }
  );
}

export async function deleteTask(taskId) {
  const db = getDatabase();
  return db.tasks.deleteOne({ $or: [{ id: taskId }, { _id: taskId }] });
}

export async function countTasks(filter = {}) {
  const db = getDatabase();
  return db.tasks.countDocuments(filter);
}
