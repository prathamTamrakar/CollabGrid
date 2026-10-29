import { getDatabase } from '../config/database.js';

export async function findChatMessageById(messageId) {
  const db = getDatabase();
  let msg = await db.project_chat_messages.findOne({ id: messageId });
  if (!msg) {
    msg = await db.project_chat_messages.findOne({ _id: messageId });
  }
  return msg;
}

export async function findMessagesByProject(projectId, limit = 100) {
  const db = getDatabase();
  return db.project_chat_messages
    .find({ project_id: projectId, deleted: { $ne: true } })
    .sort('created_at', 1)
    .to_list(limit);
}

export async function createChatMessage(messageData) {
  const db = getDatabase();
  await db.project_chat_messages.insertOne(messageData);
  return messageData;
}

export async function updateChatMessage(messageId, updateData) {
  const db = getDatabase();
  return db.project_chat_messages.updateOne(
    { $or: [{ id: messageId }, { _id: messageId }] },
    { $set: updateData }
  );
}
