import React from 'react';

export function Header({ title, onOpenMobileSidebar, onOpenNotifications, onNewTask }) {
  return (
    <header className="bg-white border-b border-slate-100 h-16 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
            {title}
          </h1>
          <span className="text-[11px] text-slate-400 font-medium">CollabGrid Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative transition"
          title="Notifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
        </button>

        {/* Primary Action Button: + New Task */}
        <button
          onClick={onNewTask}
          className="inline-flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
