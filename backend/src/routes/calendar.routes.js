import express from 'express';
import * as calendarController from '../controllers/calendar.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { validateCalendarEvent } from '../validators/calendar.validator.js';

const router = express.Router();

// POST /api/calendar/events
router.post('/events', requireAuth, validate(validateCalendarEvent), calendarController.createCalendarEvent);

// GET /api/calendar/events
router.get('/events', requireAuth, calendarController.getCalendarEvents);

// PUT /api/calendar/events/:event_id
router.put('/events/:event_id', requireAuth, calendarController.updateCalendarEvent);

// DELETE /api/calendar/events/:event_id
router.delete('/events/:event_id', requireAuth, calendarController.deleteCalendarEvent);

export default router;
