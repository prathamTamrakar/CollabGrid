import { WebSocketServer } from 'ws';
import { authenticateWebSocketUpgrade } from './websocket.auth.js';
import {
  handleWhiteboardConnect,
  handleWhiteboardMessage,
  handleWhiteboardDisconnect
} from './whiteboard.handlers.js';
import {
  handleChatConnect,
  handleChatMessage,
  handleChatDisconnect
} from './chat.handlers.js';

export function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (request, socket, head) => {
    try {
      const authResult = await authenticateWebSocketUpgrade(request);

      if (authResult.error) {
        const status = authResult.error === 404 ? '404 Not Found' : (authResult.error === 403 ? '403 Forbidden' : '401 Unauthorized');
        socket.write(`HTTP/1.1 ${status}\r\n\r\n`);
        socket.destroy();
        return;
      }

      const { userId, projectId, isWhiteboard } = authResult;

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.userId = userId;
        ws.projectId = projectId;
        ws.isWhiteboard = isWhiteboard;
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.error('[WS SERVER] Upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on('connection', async (ws) => {
    const { userId, projectId, isWhiteboard } = ws;

    if (isWhiteboard) {
      await handleWhiteboardConnect(projectId, ws, userId);

      ws.on('message', async (data) => {
        await handleWhiteboardMessage(projectId, data);
      });

      ws.on('close', () => {
        handleWhiteboardDisconnect(projectId, ws, userId);
      });
    } else {
      handleChatConnect(projectId, ws);

      ws.on('message', async (data) => {
        await handleChatMessage(projectId, userId, data);
      });

      ws.on('close', () => {
        handleChatDisconnect(projectId, ws);
      });
    }
  });

  return wss;
}

export default {
  setupWebSocketServer
};
