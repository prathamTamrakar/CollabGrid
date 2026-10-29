import AppError from '../utils/app-error.js';
import { searchUsers, findUserById } from '../repositories/user.repository.js';
import { sanitizeUser } from '../models/user.model.js';

export async function search({ query, currentUserId, limit = 10 }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new AppError('Missing search query', 422);
  }

  const users = await searchUsers({
    searchTerm: query.trim(),
    currentUserId,
    limit: parseInt(limit, 10) || 10
  });

  return users.map(u => ({
    id: u.id || u._id,
    name: u.name,
    email: u.email
  }));
}

export async function getProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user);
}

export default {
  search,
  getProfile
};
