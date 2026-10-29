import { getDatabase } from '../config/database.js';

export async function findNotificationById(notifId) {
  const db = getDatabase();
  let notif = await db.notifications.findOne({ id: notifId });
  if (!notif) {
    notif = await db.notifications.findOne({ _id: notifId });
  }
  return notif;
}

export async function findNotificationsByUser(userId, limit = 50) {
  const db = getDatabase();
  return db.notifications.find({ user_id: userId }).sort('created_at', -1).to_list(limit);
}

export async function createNotification(notifData) {
  const db = getDatabase();
  await db.notifications.insertOne(notifData);
  return notifData;
}

export async function markNotificationAsRead(notifId, userId) {
  const db = getDatabase();
  return db.notifications.updateOne(
    { $or: [{ id: notifId }, { _id: notifId }], user_id: userId },
    { $set: { status: 'read' } }
  );
}

export async function deleteNotification(notifId, userId) {
  const db = getDatabase();
  return db.notifications.deleteOne({
    $or: [{ id: notifId }, { _id: notifId }],
    user_id: userId
  });
}

export async function deleteReadNotifications(userId) {
  const db = getDatabase();
  return db.notifications.deleteMany({ user_id: userId, status: 'read' });
}
