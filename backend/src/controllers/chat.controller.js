import * as chatService from '../services/chat.service.js';
import { success } from '../utils/api-response.js';

export async function getChatMessages(req, res, next) {
  try {
    const messages = await chatService.getProjectMessages({
      projectId: req.params.project_id,
      userId: req.user.id
    });
    return success(res, messages);
  } catch (err) {
    next(err);
  }
}

export async function sendChatMessage(req, res, next) {
  try {
    const { type, content, file_name } = req.body;
    const message = await chatService.sendChatMessage({
      projectId: req.params.project_id,
      user: req.user,
      type,
      content,
      fileName: file_name
    });
    return success(res, message);
  } catch (err) {
    next(err);
  }
}

export async function editChatMessage(req, res, next) {
  try {
    const result = await chatService.editChatMessage({
      projectId: req.params.project_id,
      msgId: req.params.msg_id,
      userId: req.user.id,
      content: req.body.content
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deleteChatMessage(req, res, next) {
  try {
    const result = await chatService.deleteChatMessage({
      projectId: req.params.project_id,
      msgId: req.params.msg_id,
      userId: req.user.id
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function uploadChatFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    const safeProjectId = (req.params.project_id || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileUrl = `/uploads/chat/${safeProjectId}/${req.file.filename}`;
    return success(res, {
      url: fileUrl,
      fileName: req.file.originalname,
      file_name: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getChatMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  uploadChatFile
};
