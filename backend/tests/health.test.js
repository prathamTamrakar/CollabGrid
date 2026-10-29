import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';

describe('Health and System Routes', () => {
  let server;
  let baseUrl;

  test('Start test server', async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/health returns 200 with healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.equal(body.database, 'connected');
    assert.ok(body.timestamp);
  });

  test('GET /api/nonexistent-route returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.detail.includes('Route'));
  });

  test('Close test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
