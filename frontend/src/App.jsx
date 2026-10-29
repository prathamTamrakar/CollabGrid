import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import CollaborationPage from './pages/CollaborationPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import CalendarPage from './Components/CalendarPage.jsx';
import FeatureModal from './Components/FeatureModal.jsx';
import { getStats } from './services/dashboard.service.js';
import { getProjects } from './services/project.service.js';
import { getTasks } from './services/task.service.js';

function MainApp() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, projectsData, tasksData] = await Promise.all([
        getStats().catch(() => ({})),
        getProjects().catch(() => []),
        getTasks().catch(() => [])
      ]);

      setStats(statsData || {});
      setProjects(projectsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading CollabGrid..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
        <AuthPage />
        <FeatureModal />
      </div>
    );
  }

  const getViewTitle = (view) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'tasks':
        return 'Tasks & Kanban';
      case 'projects':
        return 'Projects';
      case 'collaboration':
        return 'Team Collaboration';
      case 'notifications':
        return 'Notifications';
      case 'calendar':
        return 'Calendar & Schedule';
      default:
        return 'CollabGrid';
    }
  };

  const navSections = [
    {
      title: 'MAIN MENU',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )
        },
        {
          id: 'calendar',
          label: 'Calendar & Schedule',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'WORKSPACE',
      items: [
        {
          id: 'tasks',
          label: 'Tasks & Kanban',
          badge: tasks?.length || 0,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        },
        {
          id: 'projects',
          label: 'Projects',
          badge: projects?.length || 0,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )
        },
        {
          id: 'collaboration',
          label: 'Team Collaboration',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )
        }
      ]
    }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'tasks':
        return <TasksPage tasks={tasks} setTasks={setTasks} fetchDashboardData={fetchDashboardData} />;
      case 'projects':
        return <ProjectsPage projects={projects} setProjects={setProjects} fetchDashboardData={fetchDashboardData} />;
      case 'collaboration':
        return <CollaborationPage setCurrentView={setCurrentView} />;
      case 'notifications':
        return <NotificationsPage setCurrentView={setCurrentView} />;
      case 'calendar':
        return <CalendarPage />;
      default:
        return (
          <DashboardPage
            stats={stats}
            projects={projects}
            tasks={tasks}
            setCurrentView={setCurrentView}
          />
        );
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      user={user}
      logout={logout}
      navSections={navSections}
      getViewTitle={getViewTitle}
    >
      {renderContent()}
      <FeatureModal />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}