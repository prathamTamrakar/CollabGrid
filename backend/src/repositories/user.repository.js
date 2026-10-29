import { getDatabase } from '../config/database.js';

export async function findUserById(id) {
  if (!id) return null;
  const db = getDatabase();
  try {
    let user = await db.users.findOne({ id });
    if (!user) {
      user = await db.users.findOne({ _id: id });
    }
    if (user) {
      user.id = user.id || user._id;
    }
    return user;
  } catch (err) {
    return null;
  }
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const db = getDatabase();
  const user = await db.users.findOne({ email: email.trim().toLowerCase() });
  if (user) {
    user.id = user.id || user._id;
  }
  return user;
}

export async function createUser(userData) {
  const db = getDatabase();
  await db.users.insertOne(userData);
  return userData;
}

export async function updateUser(id, updateData) {
  const db = getDatabase();
  return db.users.updateOne(
    { $or: [{ id }, { _id: id }] },
    { $set: updateData }
  );
}

export async function searchUsers({ searchTerm, currentUserId, limit = 10 }) {
  const db = getDatabase();
  return db.users.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } }
    ],
    id: { $ne: currentUserId }
  }).to_list(limit);
}

export async function findUsersByIds(ids = []) {
  if (!ids.length) return [];
  const db = getDatabase();
  return db.users.find({ id: { $in: ids } }).to_list(ids.length);
}
