import React, { useState } from 'react';

const currentFeatures = [
  'Beautiful, fully responsive calendar with drag, drop, and resize',
  'Event color coding and categorization',
  'Persistent event storage (database integration)',
  'Touch and mobile support',
  'Custom event modal with color picker',
  'Horizontal scroll for calendar grid on small screens',
  'Modern, professional UI/UX',
];

const upcomingFeatures = [
  'Recurring events',
  'Event reminders and notifications',
  'Calendar dashboard widget',
  'Google/Outlook calendar sync',
  'Dark mode',
  'More event types and icons',
];

export default function FeatureModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hidden"
        aria-label="Show features"
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              onClick={() => setOpen(false)}
              aria-label="Close features"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold text-indigo-600 mb-3 flex items-center gap-2">
              <span>🚀</span> New Features
            </h2>
            <ul className="space-y-2 mb-6">
              {currentFeatures.map(f => (
                <li key={f} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🔮</span> Upcoming
            </h3>
            <ul className="space-y-2">
              {upcomingFeatures.map(f => (
                <li key={f} className="text-sm text-slate-500 flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
