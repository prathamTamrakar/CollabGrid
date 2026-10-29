// Module-level connection maps
const whiteboardConnections = new Map(); // projectId -> Set of ws
const whiteboardOnlineUsers = new Map(); // projectId -> Set of userIds
const whiteboardState = new Map(); // projectId -> { actions: [], bgColor: '#ffffff' }

const chatConnections = new Map(); // projectId -> Set of ws

// --- Whiteboard Connection Functions ---

export function addWhiteboardConnection(projectId, ws, userId) {
  if (!whiteboardConnections.has(projectId)) {
    whiteboardConnections.set(projectId, new Set());
  }
  whiteboardConnections.get(projectId).add(ws);

  if (!whiteboardOnlineUsers.has(projectId)) {
    whiteboardOnlineUsers.set(projectId, new Set());
  }
  whiteboardOnlineUsers.get(projectId).add(userId);
}

export function removeWhiteboardConnection(projectId, ws, userId) {
  if (whiteboardConnections.has(projectId)) {
    const conns = whiteboardConnections.get(projectId);
    conns.delete(ws);
    if (conns.size === 0) {
      whiteboardConnections.delete(projectId);
    }
  }

  if (whiteboardOnlineUsers.has(projectId)) {
    const users = whiteboardOnlineUsers.get(projectId);
    users.delete(userId);
    if (users.size === 0) {
      whiteboardOnlineUsers.delete(projectId);
    }
  }
}

export function getWhiteboardState(projectId) {
  if (!whiteboardState.has(projectId)) {
    whiteboardState.set(projectId, { actions: [], bgColor: '#ffffff' });
  }
  return whiteboardState.get(projectId);
}

export function setWhiteboardState(projectId, state) {
  whiteboardState.set(projectId, state);
}

export function broadcastToWhiteboard(projectId, messageStr) {
  const conns = whiteboardConnections.get(projectId);
  if (!conns) return;

  for (const client of conns) {
    if (client.readyState === 1 /* OPEN */) {
      try {
        client.send(messageStr);
      } catch (err) {
        // ignore send error
      }
    }
  }
}

export function broadcastWhiteboardPresence(projectId) {
  const users = whiteboardOnlineUsers.get(projectId);
  const userIds = users ? Array.from(users) : [];
  broadcastToWhiteboard(projectId, JSON.stringify({ type: 'presence', onlineUserIds: userIds }));
}

// --- Chat Connection Functions ---

export function addChatConnection(projectId, ws) {
  if (!chatConnections.has(projectId)) {
    chatConnections.set(projectId, new Set());
  }
  chatConnections.get(projectId).add(ws);
}

export function removeChatConnection(projectId, ws) {
  if (chatConnections.has(projectId)) {
    const conns = chatConnections.get(projectId);
    conns.delete(ws);
    if (conns.size === 0) {
      chatConnections.delete(projectId);
    }
  }
}

export function broadcastToChat(projectId, messageStr) {
  const conns = chatConnections.get(projectId);
  if (!conns) return;

  for (const client of conns) {
    if (client.readyState === 1 /* OPEN */) {
      try {
        client.send(messageStr);
      } catch (err) {
        // ignore send error
      }
    }
  }
}

export default {
  addWhiteboardConnection,
  removeWhiteboardConnection,
  getWhiteboardState,
  setWhiteboardState,
  broadcastToWhiteboard,
  broadcastWhiteboardPresence,
  addChatConnection,
  removeChatConnection,
  broadcastToChat
};
