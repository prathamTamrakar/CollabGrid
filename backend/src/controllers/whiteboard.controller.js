import * as whiteboardService from '../services/whiteboard.service.js';
import { success } from '../utils/api-response.js';

export async function getWhiteboard(req, res, next) {
  try {
    const wb = await whiteboardService.getWhiteboard({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, wb.data || wb);
  } catch (err) {
    next(err);
  }
}

export async function saveWhiteboard(req, res, next) {
  try {
    const result = await whiteboardService.saveWhiteboard({
      projectId: req.params.project_id,
      userId: req.user.id,
      data: req.body.data || req.body
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  getWhiteboard,
  saveWhiteboard
};
