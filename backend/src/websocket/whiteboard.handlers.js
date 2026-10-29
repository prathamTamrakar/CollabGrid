import {
  addWhiteboardConnection,
  removeWhiteboardConnection,
  getWhiteboardState,
  setWhiteboardState,
  broadcastToWhiteboard,
  broadcastWhiteboardPresence
} from './connection.manager.js';
import {
  findWhiteboardByProjectId,
  upsertWhiteboard
} from '../repositories/whiteboard.repository.js';

export async function handleWhiteboardConnect(projectId, ws, userId) {
  addWhiteboardConnection(projectId, ws, userId);

  // Initialize whiteboard state from database if not present in memory
  const state = getWhiteboardState(projectId);
  if (state.actions.length === 0) {
    const wb = await findWhiteboardByProjectId(projectId);
    if (wb && wb.data) {
      if (typeof wb.data === 'object' && !Array.isArray(wb.data)) {
        setWhiteboardState(projectId, {
          actions: Array.isArray(wb.data.actions) ? wb.data.actions : [],
          bgColor: wb.data.bgColor || '#ffffff'
        });
      } else if (Array.isArray(wb.data)) {
        setWhiteboardState(projectId, { actions: wb.data, bgColor: '#ffffff' });
      }
    }
  }

  broadcastWhiteboardPresence(projectId);
}

export async function persistWhiteboardState(projectId) {
  const currentState = getWhiteboardState(projectId);
  try {
    await upsertWhiteboard(projectId, {
      project_id: projectId,
      data: currentState,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[WS] Failed to persist whiteboard state:', err);
  }
}

export async function handleWhiteboardMessage(projectId, data) {
  try {
    const raw = data.toString();
    const msg = JSON.parse(raw);
    const state = getWhiteboardState(projectId);

    if (msg.type === 'draw') {
      state.actions.push(msg);
      broadcastToWhiteboard(projectId, raw);
    } else if (msg.type === 'undo') {
      if (state.actions.length > 0) {
        state.actions.pop();
        broadcastToWhiteboard(projectId, JSON.stringify({ type: 'undo' }));
        await persistWhiteboardState(projectId);
      }
    } else if (msg.type === 'clear') {
      state.actions = [];
      broadcastToWhiteboard(projectId, JSON.stringify({ type: 'clear' }));
      await persistWhiteboardState(projectId);
    } else if (msg.type === 'bgcolor') {
      state.bgColor = msg.color || '#ffffff';
      broadcastToWhiteboard(projectId, raw);
      await persistWhiteboardState(projectId);
    } else {
      broadcastToWhiteboard(projectId, raw);
    }
  } catch (err) {
    console.error('[WS] Whiteboard message parse error:', err);
  }
}

export function handleWhiteboardDisconnect(projectId, ws, userId) {
  removeWhiteboardConnection(projectId, ws, userId);
  broadcastWhiteboardPresence(projectId);
  persistWhiteboardState(projectId);
}

export default {
  handleWhiteboardConnect,
  handleWhiteboardMessage,
  handleWhiteboardDisconnect
};
