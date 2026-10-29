import * as calendarService from '../services/calendar.service.js';
import { success } from '../utils/api-response.js';

export async function getCalendarEvents(req, res, next) {
  try {
    const events = await calendarService.getCalendarEvents(req.user.id, {
      start: req.query.start,
      end: req.query.end
    });
    return success(res, events);
  } catch (err) {
    next(err);
  }
}

export async function createCalendarEvent(req, res, next) {
  try {
    const event = await calendarService.createCalendarEvent(req.user.id, req.body);
    return success(res, event);
  } catch (err) {
    next(err);
  }
}

export async function updateCalendarEvent(req, res, next) {
  try {
    const event = await calendarService.updateCalendarEvent(
      req.params.event_id,
      req.user.id,
      req.body
    );
    return success(res, event);
  } catch (err) {
    next(err);
  }
}

export async function deleteCalendarEvent(req, res, next) {
  try {
    const result = await calendarService.removeCalendarEvent(
      req.params.event_id,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};
