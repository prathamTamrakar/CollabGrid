import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const calendarEventSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  start: { type: String, required: true, index: true },
  end: { type: String, default: null },
  allDay: { type: Boolean, default: false },
  color: { type: String, default: '#2563eb' },
  user_id: { type: String, required: true, index: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const CalendarEventModel =
  mongoose.models.CalendarEvent ||
  mongoose.model('CalendarEvent', calendarEventSchema, 'calendar_events');

export function createCalendarEventDocument({
  id, title, description = '', start, end = null, allDay = false, color = '#2563eb',
  userId, createdAt, updatedAt
}) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    title: title ? title.trim() : '',
    description: description ? description.trim() : '',
    start: start ? (start instanceof Date ? start.toISOString() : start) : now,
    end: end ? (end instanceof Date ? end.toISOString() : end) : null,
    allDay: !!allDay,
    color: color || '#2563eb',
    user_id: userId,
    created_at: createdAt || now,
    updated_at: updatedAt || now
  };
}
