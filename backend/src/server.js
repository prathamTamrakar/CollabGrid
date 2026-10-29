import http from 'http';
import { config, validateEnv } from './config/env.js';
import { initDatabase, closeDatabase } from './config/database.js';
import { setupWebSocketServer } from './websocket/websocket.server.js';
import app from './app.js';

// Validate environment on startup
validateEnv();

const server = http.createServer(app);

// Attach WebSockets
setupWebSocketServer(server);

const PORT = config.port;

async function start() {
  try {
    await initDatabase();

    server.listen(PORT, () => {
      console.log(`🚀 CollabGrid Node.js Backend listening on port ${PORT}`);
      console.log(`📡 REST API: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSockets: ws://localhost:${PORT}/api/ws`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function shutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP/WebSocket server closed.');
    await closeDatabase();
    console.log('[SHUTDOWN] Database connection closed.');
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

export { server, app };
