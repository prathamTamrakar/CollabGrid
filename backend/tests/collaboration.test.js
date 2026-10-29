import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import { createAccessToken } from '../src/utils/token.util.js';
import { getDatabase, initDatabase, closeDatabase } from '../src/config/database.js';

describe('Collaboration Endpoints & Services', () => {
  let server;
  let baseUrl;
  let user1Token;
  let user2Token;
  const user1Id = 'collab-user-1-uuid';
  const user2Id = 'collab-user-2-uuid';
  let createdProjectId;
  let sentInviteId;

  before(async () => {
    await initDatabase();
    const db = getDatabase();

    // Seed test users
    await db.users.deleteOne({ id: user1Id });
    await db.users.deleteOne({ id: user2Id });
    await db.users.insertOne({
      id: user1Id,
      name: 'Alice Leader',
      email: 'alice@collabgrid.com',
      hashed_password: 'hashedpassword',
      created_at: new Date().toISOString()
    });
    await db.users.insertOne({
      id: user2Id,
      name: 'Bob Teammate',
      email: 'bob@collabgrid.com',
      hashed_password: 'hashedpassword',
      created_at: new Date().toISOString()
    });

    user1Token = createAccessToken(user1Id);
    user2Token = createAccessToken(user2Id);

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await closeDatabase();
  });

  test('Create a project for Alice', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        name: 'Alpha Redesign',
        description: 'Collaborative redesign project',
        color: '#6366f1'
      })
    });

    assert.ok(res.status === 200 || res.status === 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.name, 'Alpha Redesign');
    assert.equal(body.user_id, user1Id);
    createdProjectId = body.id;
  });

  test('GET /api/collaboration/projects returns Alice owned project with owner_name', async () => {
    const res = await fetch(`${baseUrl}/api/collaboration/projects`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });

    assert.equal(res.status, 200);
    const projects = await res.json();
    assert.ok(Array.isArray(projects));
    const project = projects.find(p => p.id === createdProjectId);
    assert.ok(project, 'Project should be present in collaboration projects list');
    assert.equal(project.user_id, user1Id);
    assert.equal(project.name, 'Alpha Redesign');
    assert.ok(project.owner_name, 'owner_name should be populated');
  });

  test('Search users for collaboration', async () => {
    const res = await fetch(`${baseUrl}/api/users/search?query=Bob`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });

    assert.equal(res.status, 200);
    const users = await res.json();
    assert.ok(Array.isArray(users));
    assert.ok(users.some(u => u.name === 'Bob Teammate'));
  });

  test('Alice sends an invitation to Bob for the project', async () => {
    const res = await fetch(`${baseUrl}/api/collaboration/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        project_id: createdProjectId,
        user_id: user2Id
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Invite sent');
  });

  test('Bob checks pending invites and sees invitation with project and sender names', async () => {
    const res = await fetch(`${baseUrl}/api/collaboration/invites`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    assert.equal(res.status, 200);
    const invites = await res.json();
    assert.ok(Array.isArray(invites));
    const invite = invites.find(i => i.project_id === createdProjectId);
    assert.ok(invite, 'Invite should be found in Bob pending list');
    assert.equal(invite.from_user_name, 'Alice Leader');
    assert.equal(invite.project_name, 'Alpha Redesign');
    assert.equal(invite.from_user_email, 'alice@collabgrid.com');
    sentInviteId = invite.id;
  });

  test('Bob accepts the project invitation', async () => {
    const res = await fetch(`${baseUrl}/api/collaboration/invite/${sentInviteId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Invite accepted');
  });

  test('Bob now sees Alpha Redesign in GET /api/collaboration/projects as collaborator', async () => {
    const res = await fetch(`${baseUrl}/api/collaboration/projects`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    assert.equal(res.status, 200);
    const projects = await res.json();
    const project = projects.find(p => p.id === createdProjectId);
    assert.ok(project, 'Bob should now see collaborative project');
    assert.equal(project.owner_name, 'Alice Leader');
    assert.ok(project.collaborators.includes(user2Id));
  });

  test('GET /api/projects/:projectId/collaborators returns both Alice and Bob', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${createdProjectId}/collaborators`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });

    assert.equal(res.status, 200);
    const collaborators = await res.json();
    assert.ok(Array.isArray(collaborators));
    assert.ok(collaborators.some(c => c.name === 'Alice Leader' || c.id === user1Id));
    assert.ok(collaborators.some(c => c.name === 'Bob Teammate' || c.id === user2Id));
  });
});
