import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createTaskDocument } from '../src/models/task.model.js';
import { validateCreateTask } from '../src/validators/task.validator.js';
import { createProjectDocument } from '../src/models/project.model.js';
import { createCalendarEventDocument } from '../src/models/calendar.model.js';

describe('Models and Validators', () => {
  test('createTaskDocument formats defaults appropriately', () => {
    const task = createTaskDocument({
      title: ' Refactor Backend ',
      description: ' Clean MVC architecture ',
      userId: 'usr-1'
    });

    assert.equal(task.title, 'Refactor Backend');
    assert.equal(task.description, 'Clean MVC architecture');
    assert.equal(task.status, 'todo');
    assert.equal(task.priority, 'medium');
    assert.equal(task.user_id, 'usr-1');
    assert.ok(task.id);
    assert.ok(task.created_at);
  });

  test('validateCreateTask validates presence of title', () => {
    assert.ok(validateCreateTask({ body: {} }));
    assert.ok(validateCreateTask({ body: { title: '   ' } }));
    assert.equal(validateCreateTask({ body: { title: 'Valid task title' } }), null);
  });

  test('createProjectDocument initializes project with defaults', () => {
    const project = createProjectDocument({
      name: ' CollabGrid Redesign ',
      userId: 'usr-1'
    });

    assert.equal(project.name, 'CollabGrid Redesign');
    assert.equal(project.color, '#4f46e5');
    assert.equal(project.user_id, 'usr-1');
    assert.ok(project.id);
  });

  test('createCalendarEventDocument formats date and time properly', () => {
    const now = new Date();
    const event = createCalendarEventDocument({
      title: 'Team Sync',
      start: now,
      userId: 'usr-1'
    });

    assert.equal(event.title, 'Team Sync');
    assert.equal(event.start, now.toISOString());
    assert.equal(event.allDay, false);
    assert.equal(event.color, '#2563eb');
  });
});
