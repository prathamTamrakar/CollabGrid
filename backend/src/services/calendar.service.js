import AppError from '../utils/app-error.js';
import { createCalendarEventDocument } from '../models/calendar.model.js';
import {
  findEventsByUser,
  findEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../repositories/calendar.repository.js';

export async function getCalendarEvents(userId, { start, end } = {}) {
  const events = await findEventsByUser(userId, { start, end });
  return events.map(e => ({
    ...e,
    id: e.id || e._id
  }));
}

export async function createCalendarEvent(userId, eventData) {
  const { title, description, start, end, allDay, color } = eventData;

  const doc = createCalendarEventDocument({
    title,
    description,
    start,
    end,
    allDay,
    color,
    userId
  });

  await createEvent(doc);
  return doc;
}

export async function updateCalendarEvent(eventId, userId, eventData) {
  const event = await findEventById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  if (event.user_id !== userId) {
    throw new AppError('Not authorized to update this event', 403);
  }

  const cleanUpdates = {};
  if ('title' in eventData) cleanUpdates.title = eventData.title.trim();
  if ('description' in eventData) cleanUpdates.description = eventData.description.trim();
  if ('start' in eventData) cleanUpdates.start = eventData.start;
  if ('end' in eventData) cleanUpdates.end = eventData.end;
  if ('allDay' in eventData) cleanUpdates.allDay = !!eventData.allDay;
  if ('color' in eventData) cleanUpdates.color = eventData.color;
  cleanUpdates.updated_at = new Date().toISOString();

  await updateEvent(eventId, userId, cleanUpdates);

  const updated = await findEventById(eventId);
  updated.id = updated.id || updated._id;
  return updated;
}

export async function removeCalendarEvent(eventId, userId) {
  const event = await findEventById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  if (event.user_id !== userId) {
    throw new AppError('Not authorized to delete this event', 403);
  }

  const result = await deleteEvent(eventId, userId);
  if (result.deletedCount === 0) {
    throw new AppError('Event not found', 404);
  }
  return { message: 'Event deleted successfully' };
}

export default {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  removeCalendarEvent
};
