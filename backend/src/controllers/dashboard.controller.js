import * as dashboardService from '../services/dashboard.service.js';
import { success } from '../utils/api-response.js';

export async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getStatsForUser(req.user.id);
    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

export default {
  getStats
};
