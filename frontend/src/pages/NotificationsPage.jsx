import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  deleteAllRead
} from '../services/notification.service.js';
import { getCollaborativeProjects } from '../services/collaboration.service.js';

const NotificationsPage = ({ setCurrentView }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const { user } = useAuth();
  const [projectMap, setProjectMap] = useState({});

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getCollaborativeProjects();
        const map = {};
        if (Array.isArray(projects)) {
          projects.forEach(p => { map[p.id] = p.name; });
        }
        setProjectMap(map);
      } catch { }
    };
    fetchProjects();
  }, [user]);

  const handleMarkRead = async (notif_id) => {
    setMarking(m => ({ ...m, [notif_id]: true }));
    try {
      await markAsRead(notif_id);
      setNotifications(n => n.map(notif => notif.id === notif_id ? { ...notif, status: 'read' } : notif));
    } catch (err) { }
    setMarking(m => ({ ...m, [notif_id]: false }));
  };

  const handleDeleteNotification = async (notif_id) => {
    try {
      await deleteNotification(notif_id);
      setNotifications(n => n.filter(nf => nf.id !== notif_id));
    } catch (err) { }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
      setNotifications(n => n.filter(notif => notif.status !== 'read'));
    } catch (err) { }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => n.status === 'unread').map(n => markAsRead(n.id))
      );
      setNotifications(n => n.map(notif => ({ ...notif, status: 'read' })));
    } catch (err) { }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'read') return n.status === 'read';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6366f1] text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Stay up to date with project invitations and activity</p>
        </div>

        {/* Bulk action buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={handleDeleteAllRead}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Clear read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'read'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-[#6366f1] rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-lg">
            🔔
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">All caught up!</h4>
          <p className="text-xs text-slate-500">You don't have any notifications in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notif => {
            const isUnread = notif.status === 'unread';
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-indigo-200/80 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                    isUnread ? 'bg-indigo-50 text-[#6366f1]' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isUnread ? '📬' : '📄'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                        {notif.message}
                      </span>
                      {notif.related_project_id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {projectMap[notif.related_project_id] || 'Workspace'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={marking[notif.id]}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {marking[notif.id] ? 'Saving...' : 'Mark read'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
