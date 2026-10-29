import api from './api.js';

export async function getCalendarEvents({ start, end } = {}) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const res = await api.get('/calendar/events', { params });
  return res.data;
}

export async function createCalendarEvent(eventData) {
  const res = await api.post('/calendar/events', eventData);
  return res.data;
}

export async function updateCalendarEvent(eventId, eventData) {
  const res = await api.put(`/calendar/events/${eventId}`, eventData);
  return res.data;
}

export async function deleteCalendarEvent(eventId) {
  const res = await api.delete(`/calendar/events/${eventId}`);
  return res.data;
}

export default {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};
