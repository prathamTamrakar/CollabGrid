import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../services/calendar.service.js';

const presetColors = [
  '#3788d8',
  '#ef4444',
  '#22c55e',
  '#2563eb',
  '#f59e42',
  '#a855f7',
  '#fbbf24',
  '#64748b',
];

const EventModal = ({ eventInfo, isEditing, onClose, calendarRef }) => {
  const [title, setTitle] = useState(eventInfo.title || '');
  const [description, setDescription] = useState(eventInfo.extendedProps?.description || '');
  const [color, setColor] = useState(eventInfo.color || eventInfo.backgroundColor || '#3788d8');
  const [start, setStart] = useState(eventInfo.start ? new Date(eventInfo.start) : new Date());
  const [end, setEnd] = useState(eventInfo.end ? new Date(eventInfo.end) : new Date());
  const [allDay, setAllDay] = useState(eventInfo.allDay || false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('Please provide valid start and end times.');
      return;
    }
    const eventData = {
      title,
      description,
      color,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
    };

    const calendarApi = calendarRef.current.getApi();

    try {
      if (isEditing) {
        await updateCalendarEvent(eventInfo.id, eventData);
      } else {
        await createCalendarEvent(eventData);
      }
      calendarApi.refetchEvents();
      onClose();
    } catch (err) {
      console.error('Failed to save calendar event:', err);
      alert('Could not save event. Please try again.');
    }
  };

  const handleDelete = async () => {
    const calendarApi = calendarRef.current.getApi();
    try {
      await deleteCalendarEvent(eventInfo.id);
      calendarApi.refetchEvents();
      onClose();
    } catch (err) {
      console.error('Failed to delete calendar event:', err);
      alert('Could not delete event. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 animate-bounce-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold leading-none"
            >
              &times;
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Design review meeting"
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notes or details regarding this event..."
              rows={3}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Event Color
              </label>
              <input
                id="event-color"
                type="color"
                className="w-6 h-6 rounded-full border-0 cursor-pointer p-0 bg-transparent"
                value={color}
                onChange={e => setColor(e.target.value)}
                aria-label="Pick custom color"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 border-white shadow-xs transition-transform duration-150 ${color === preset ? 'scale-125 ring-2 ring-indigo-600 ring-offset-1' : 'hover:scale-110'
                    }`}
                  style={{ background: preset }}
                  onClick={() => setColor(preset)}
                  aria-label={`Choose color ${preset}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="mr-auto px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              {isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CalendarPage = React.memo(() => {
  const [events, setEvents] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, event: null, isEditing: false });
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [title, setTitle] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    setTimeout(() => {
      if (calendarRef.current && calendarRef.current.getApi) {
        setTitle(calendarRef.current.getApi().view.title);
      }
    }, 0);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchEvents = useCallback(async (info, successCallback, failureCallback) => {
    try {
      const data = await getCalendarEvents({ start: info.startStr, end: info.endStr });
      const eventsList = Array.isArray(data) ? data : [];
      successCallback(eventsList.map(event => ({
        ...event,
        id: event.id,
        allDay: event.allDay,
      })));
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      if (failureCallback) failureCallback(error);
    }
  }, []);

  const handlePrev = () => {
    const api = calendarRef.current.getApi();
    api.prev();
    setTitle(api.view.title);
  };
  const handleNext = () => {
    const api = calendarRef.current.getApi();
    api.next();
    setTitle(api.view.title);
  };
  const handleToday = () => {
    const api = calendarRef.current.getApi();
    api.today();
    setTitle(api.view.title);
  };
  const handleViewChange = (view) => {
    const api = calendarRef.current.getApi();
    api.changeView(view);
    setCurrentView(view);
    setTitle(api.view.title);
  };
  const handleDatesSet = (arg) => {
    setTitle(arg.view.title);
    setCurrentView(arg.view.type);
  };

  const handleDateSelect = useCallback((selectInfo) => {
    setModalState({ isOpen: true, event: { start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay }, isEditing: false });
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    setModalState({ isOpen: true, event: clickInfo.event.toPlainObject(), isEditing: true });
  }, []);

  const handleEventChange = useCallback(async (changeInfo) => {
    const calendarApi = calendarRef.current.getApi();
    const { event } = changeInfo;
    let start = event.start;
    let end = event.end ? event.end : event.start;
    if (event.allDay) {
      start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      end = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    }
    const eventData = {
      title: event.title,
      description: event.extendedProps?.description || '',
      color: event.backgroundColor,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: event.allDay,
    };
    try {
      await updateCalendarEvent(event.id, eventData);
      calendarApi.refetchEvents();
    } catch (error) {
      console.error("Failed to update event:", error);
      changeInfo.revert();
      alert("Could not save event changes. Please try again.");
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, event: null, isEditing: false });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar & Schedule</h2>
        <p className="text-sm text-slate-500 mt-0.5">Track project milestones, deadlines, and schedule events across your calendar</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 overflow-hidden">
        {isMobile ? (
          <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  onClick={handlePrev}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  onClick={handleNext}
                >
                  &gt;
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  onClick={handleToday}
                >
                  Today
                </button>
              </div>
              <div className="text-sm font-bold text-slate-800">{title}</div>
            </div>
            <div className="flex items-center gap-1.5 self-center">
              <button
                type="button"
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${currentView === 'dayGridMonth' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                onClick={() => handleViewChange('dayGridMonth')}
              >
                Month
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${currentView === 'timeGridWeek' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                onClick={() => handleViewChange('timeGridWeek')}
              >
                Week
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${currentView === 'timeGridDay' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                onClick={() => handleViewChange('timeGridDay')}
              >
                Day
              </button>
            </div>
          </div>
        ) : null}

        <div className="w-full overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={isMobile ? false : {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={fetchEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            timeZone="UTC"
            longPressDelay={300}
            eventClassNames={(arg) => {
              if (arg.event.extendedProps.color) {
                return [`calendar-event-color-${arg.event.extendedProps.color.replace('#', '')}`];
              }
              return [];
            }}
            datesSet={handleDatesSet}
          />
        </div>

        {modalState.isOpen && (
          <EventModal
            eventInfo={modalState.event}
            isEditing={modalState.isEditing}
            onClose={closeModal}
            calendarRef={calendarRef}
          />
        )}
      </div>
    </div>
  );
});

export default CalendarPage;
