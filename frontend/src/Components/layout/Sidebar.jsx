import React from 'react';

export function Sidebar({ navSections, currentView, setCurrentView, user, logout }) {
  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CG';

  return (
    <aside className="hidden lg:flex w-60 bg-white border-r border-slate-100 flex-col flex-shrink-0 select-none justify-between z-20">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Workspace Switcher Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="CollabGrid logo" className="h-6 w-auto object-contain" />
            <span className="font-bold text-sm text-slate-900 tracking-tight">CollabGrid</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition" title="Workspace options">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100/90 text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer: User profile card & logout */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-indigo-100">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate leading-tight">{user?.name}</div>
              <div className="text-[11px] text-slate-400 truncate leading-tight">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
