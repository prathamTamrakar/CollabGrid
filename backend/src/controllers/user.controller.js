import * as userService from '../services/user.service.js';
import { success } from '../utils/api-response.js';

export async function searchUsers(req, res, next) {
  try {
    const searchTerm = req.query.query || req.query.q;
    const users = await userService.search({
      query: searchTerm,
      currentUserId: req.user.id,
      limit: req.query.limit
    });
    return success(res, users);
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

export default {
  searchUsers,
  getProfile
};
