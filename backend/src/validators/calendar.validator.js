export function validateCalendarEvent(req) {
  const { title, start } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) return 'Event title is required';
  if (!start) return 'Event start date/time is required';
  return null;
}
