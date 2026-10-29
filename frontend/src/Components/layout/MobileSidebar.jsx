import React from 'react';

export function MobileSidebar({ isOpen, onClose, navSections, currentView, setCurrentView, logout }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>
      <aside className="relative w-64 bg-white shadow-2xl p-4 flex flex-col justify-between h-full z-10 animate-slide-in">
        <div className="overflow-y-auto flex-1">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="CollabGrid logo" className="h-6 w-auto object-contain" />
              <span className="font-bold text-sm text-slate-900">CollabGrid</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              ✕
            </button>
          </div>
          <nav className="space-y-4">
            {navSections.map((section, sidx) => (
              <div key={sidx}>
                <div className="text-[10px] font-semibold text-slate-400 tracking-wider pb-1 px-2">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                        currentView === item.id
                          ? 'bg-slate-100 font-semibold text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full text-xs font-medium text-red-600 flex items-center justify-center gap-2 py-2"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}

export default MobileSidebar;
