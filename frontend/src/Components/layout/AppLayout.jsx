import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { MobileSidebar } from './MobileSidebar.jsx';
import { Header } from './Header.jsx';

export function AppLayout({
  currentView,
  setCurrentView,
  user,
  logout,
  navSections,
  getViewTitle,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#fafbfc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* Permanent Desktop Left Sidebar */}
      <Sidebar
        navSections={navSections}
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        logout={logout}
      />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navSections={navSections}
        currentView={currentView}
        setCurrentView={setCurrentView}
        logout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getViewTitle(currentView)}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
          onOpenNotifications={() => setCurrentView('notifications')}
          onNewTask={() => setCurrentView('tasks')}
        />

        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
