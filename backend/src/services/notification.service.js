import AppError from '../utils/app-error.js';
import {
  findNotificationsByUser,
  findNotificationById,
  markNotificationAsRead,
  deleteNotification,
  deleteReadNotifications
} from '../repositories/notification.repository.js';

export async function getNotifications(userId) {
  const notifs = await findNotificationsByUser(userId, 50);
  return notifs.map(n => ({
    ...n,
    id: n.id || n._id
  }));
}

export async function markAsRead(notifId, userId) {
  const notif = await findNotificationById(notifId);
  if (!notif) {
    throw new AppError('Notification not found', 404);
  }
  if (notif.user_id !== userId) {
    throw new AppError('Not authorized', 403);
  }
  await markNotificationAsRead(notifId, userId);
  return { message: 'Marked as read' };
}

export async function removeNotification(notifId, userId) {
  const notif = await findNotificationById(notifId);
  if (!notif) {
    throw new AppError('Notification not found', 404);
  }
  if (notif.user_id !== userId) {
    throw new AppError('Not authorized', 403);
  }
  await deleteNotification(notifId, userId);
  return { message: 'Notification deleted' };
}

export async function removeAllRead(userId) {
  await deleteReadNotifications(userId);
  return { message: 'Read notifications cleared' };
}

export default {
  getNotifications,
  markAsRead,
  removeNotification,
  removeAllRead
};
