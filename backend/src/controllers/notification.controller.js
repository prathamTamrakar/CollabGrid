import * as notificationService from '../services/notification.service.js';
import { success } from '../utils/api-response.js';

export async function getNotifications(req, res, next) {
  try {
    const notifs = await notificationService.getNotifications(req.user.id);
    return success(res, notifs);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const result = await notificationService.markAsRead(req.params.notif_id, req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const result = await notificationService.removeNotification(req.params.notif_id, req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deleteAllReadNotifications(req, res, next) {
  try {
    const result = await notificationService.removeAllRead(req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllReadNotifications
};
