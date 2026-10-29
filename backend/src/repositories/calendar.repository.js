import { getDatabase } from '../config/database.js';

export async function findEventById(eventId) {
  const db = getDatabase();
  let event = await db.calendar_events.findOne({ id: eventId });
  if (!event) {
    event = await db.calendar_events.findOne({ _id: eventId });
  }
  return event;
}

export async function findEventsByUser(userId, { start, end } = {}) {
  const db = getDatabase();
  const query = { user_id: userId };

  if (start && end) {
    query.$or = [
      { start: { $gte: start, $lte: end } },
      { end: { $gte: start, $lte: end } }
    ];
  }

  return db.calendar_events.find(query).sort('start', 1).to_list(1000);
}

export async function createEvent(eventData) {
  const db = getDatabase();
  await db.calendar_events.insertOne(eventData);
  return eventData;
}

export async function updateEvent(eventId, userId, updateData) {
  const db = getDatabase();
  return db.calendar_events.updateOne(
    { $or: [{ id: eventId }, { _id: eventId }], user_id: userId },
    { $set: updateData }
  );
}

export async function deleteEvent(eventId, userId) {
  const db = getDatabase();
  return db.calendar_events.deleteOne({
    $or: [{ id: eventId }, { _id: eventId }],
    user_id: userId
  });
}
