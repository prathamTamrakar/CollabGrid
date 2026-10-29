import React, { useState } from 'react';
import DetailsModal from '../components/dashboard/DetailsModal.jsx';

const DashboardPage = ({ stats = {}, projects = [], tasks = [], setCurrentView }) => {
  const [modalData, setModalData] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const [timeView, setTimeView] = useState('Week');
  const [tableSearch, setTableSearch] = useState('');

  const today = new Date();
  const productivityScore = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;
  const completedThisWeek = tasks.filter(task => task.status === 'done' && new Date(task.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'done');
  const activeProjects = projects.filter(p => tasks.some(t => t.project_id === p.id && t.status !== 'done')).length;
  const upcomingDeadlines = tasks.filter(task => task.status !== 'done' && task.due_date && new Date(task.due_date) >= today && new Date(task.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const overdueTasks = tasks.filter(task => task.status !== 'done' && task.due_date && new Date(task.due_date) < today);

  // Calculate current week days dynamically
  const curr = new Date();
  const firstDayOfWeek = new Date(curr);
  firstDayOfWeek.setDate(curr.getDate() - curr.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(firstDayOfWeek);
    d.setDate(firstDayOfWeek.getDate() + i);
    return d;
  });

  const monthYearStr = curr.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRangeStr = `Week ${Math.ceil((curr.getDate() + 6 - curr.getDay()) / 7)} · ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const filteredTasks = sortedTasks.filter(t => 
    !tableSearch || 
    t.title?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    t.description?.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top 2-Column Section: Schedule Grid on Left, Stats Rail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Calendar / Task Schedule Card (approx 72% / 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          {/* Header with Title, Today, Prev/Next, and Day/Week/Month Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{monthYearStr}</h2>
              <div className="text-xs text-slate-400 font-normal">{weekRangeStr}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('calendar')}
                className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Today
              </button>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 border-r border-slate-200"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                >
                  →
                </button>
              </div>

              {/* Day / Week / Month Segmented Switch */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
                {['Day', 'Week', 'Month'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setTimeView(tab);
                      if (tab !== 'Week') setCurrentView('calendar');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      timeView === tab
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Calendar Matrix showing CollabGrid tasks */}
          <div className="pt-4 overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Day Header Row */}
              <div className="grid grid-cols-8 text-center text-xs font-medium text-slate-400 pb-3 border-b border-slate-100">
                <div className="text-left pl-1">TIME</div>
                {weekDays.map((d, index) => {
                  const isCurrentDay = d.toDateString() === today.toDateString();
                  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                  return (
                    <div key={index} className="flex items-center justify-center gap-1">
                      <span>{dayNames[d.getDay()]}</span>
                      {isCurrentDay ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] font-bold">
                          {d.getDate()}
                        </span>
                      ) : (
                        <span className="text-slate-900 font-bold">{d.getDate()}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Matrix Hours & Tasks */}
              <div className="relative text-xs divide-y divide-slate-100/70">
                {['08:00', '09:00', '10:00', '11:00', '12:00'].map((timeSlot, slotIdx) => {
                  return (
                    <div key={timeSlot} className="grid grid-cols-8 min-h-[58px] py-1.5 items-start">
                      <div className="text-slate-400 font-normal pt-1">{timeSlot}</div>
                      {weekDays.map((day, dIdx) => {
                        const dayTasks = tasks.filter(t => {
                          if (!t.due_date) return false;
                          const tDate = new Date(t.due_date);
                          return tDate.getDay() === day.getDay();
                        });
                        const taskForSlot = dayTasks[slotIdx];

                        return (
                          <div key={dIdx} className="px-1 min-h-[46px]">
                            {taskForSlot ? (
                              <div
                                onClick={() => setModalData({
                                  isOpen: true,
                                  title: taskForSlot.title,
                                  data: [taskForSlot],
                                  columns: [
                                    { header: 'Title', accessor: item => item.title },
                                    { header: 'Status', accessor: item => item.status },
                                    { header: 'Priority', accessor: item => item.priority },
                                    { header: 'Due Date', accessor: item => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' },
                                    { header: 'Description', accessor: item => item.description || 'No description' }
                                  ]
                                })}
                                className={`p-1.5 rounded-xl text-[11px] cursor-pointer hover:shadow-xs transition border leading-tight ${
                                  taskForSlot.status === 'done'
                                    ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
                                    : taskForSlot.status === 'in_progress'
                                    ? 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]'
                                    : 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]'
                                }`}
                              >
                                <div className="font-semibold truncate">{taskForSlot.title}</div>
                                <div className="text-[10px] opacity-80 capitalize">{taskForSlot.status.replace('_', ' ')}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Quick Jump to Full Calendar */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Showing this week's scheduled tasks and milestones</span>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1"
                >
                  Open Full Interactive Calendar →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stats Rail ("Workspace Stats" inspired by Reference Image) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Workspace stats</h3>
            <button
              onClick={() => setCurrentView('tasks')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              View Tasks
            </button>
          </div>

          <div className="pt-4 space-y-4">
            {/* 1: Completed Tasks */}
            <div
              onClick={() => setModalData({
                isOpen: true,
                title: 'Completed Tasks',
                data: tasks.filter(t => t.status === 'done'),
                columns: [
                  { header: 'Title', accessor: item => item.title },
                  { header: 'Priority', accessor: item => item.priority },
                  { header: 'Updated', accessor: item => new Date(item.updated_at || item.created_at).toLocaleDateString() }
                ]
              })}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {stats.completed_tasks || 0} tasks completed
                </div>
                <div className="text-[11px] text-slate-400">{productivityScore}% completion rate</div>
              </div>
            </div>

            {/* 2: In Progress */}
            <div
              onClick={() => setModalData({
                isOpen: true,
                title: 'In Progress Tasks',
                data: tasks.filter(t => t.status === 'in_progress'),
                columns: [
                  { header: 'Title', accessor: item => item.title },
                  { header: 'Priority', accessor: item => item.priority },
                  { header: 'Due Date', accessor: item => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' }
                ]
              })}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#fff7ed] text-[#f97316] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {stats.in_progress_tasks || 0} in progress
                </div>
                <div className="text-[11px] text-slate-400">{highPriorityTasks.length} high priority active</div>
              </div>
            </div>

            {/* 3: Upcoming Deadlines */}
            <div
              onClick={() => setModalData({
                isOpen: true,
                title: 'Upcoming Deadlines',
                data: upcomingDeadlines,
                columns: [
                  { header: 'Title', accessor: item => item.title },
                  { header: 'Priority', accessor: item => item.priority },
                  { header: 'Due Date', accessor: item => new Date(item.due_date).toLocaleDateString() }
                ]
              })}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {upcomingDeadlines.length} upcoming deadlines
                </div>
                <div className="text-[11px] text-slate-400">Due within next 7 days</div>
              </div>
            </div>

            {/* 4: Active Projects */}
            <div
              onClick={() => setCurrentView('projects')}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#ecfeff] text-[#06b6d4] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {stats.total_projects || 0} active projects
                </div>
                <div className="text-[11px] text-slate-400">{activeProjects} with ongoing tasks</div>
              </div>
            </div>

            {/* 5: High Priority & Overdue */}
            <div
              onClick={() => setModalData({
                isOpen: true,
                title: 'High Priority & Overdue Tasks',
                data: [...highPriorityTasks, ...overdueTasks],
                columns: [
                  { header: 'Title', accessor: item => item.title },
                  { header: 'Status', accessor: item => item.status },
                  { header: 'Priority', accessor: item => item.priority },
                  { header: 'Due Date', accessor: item => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' }
                ]
              })}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#fdf2f8] text-[#ec4899] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {highPriorityTasks.length} high priority tasks
                </div>
                <div className="text-[11px] text-slate-400">{overdueTasks.length} overdue tasks requiring attention</div>
              </div>
            </div>

            {/* 6: Completed This Week */}
            <div
              onClick={() => setModalData({
                isOpen: true,
                title: 'Completed This Week',
                data: tasks.filter(t => t.status === 'done' && new Date(t.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                columns: [
                  { header: 'Title', accessor: item => item.title },
                  { header: 'Priority', accessor: item => item.priority },
                  { header: 'Completed At', accessor: item => new Date(item.updated_at).toLocaleDateString() }
                ]
              })}
              className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#f5f3ff] text-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {completedThisWeek} completed this week
                </div>
                <div className="text-[11px] text-slate-400">Weekly team velocity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tasks & Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Tasks & Recent Activity</h3>
            <span className="text-xs text-slate-400">All tasks in current workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setCurrentView('tasks')}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              Manage Tasks
            </button>
          </div>
        </div>

        {/* Clean Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Task Title</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const isDone = t.status === 'done';
                  const isInProgress = t.status === 'in_progress';
                  const project = projects.find(p => p.id === t.project_id);
                  const isTaskOverdue = t.due_date && new Date(t.due_date) < today && !isDone;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] rounded-full px-2.5 py-0.5 font-semibold text-[11px]">
                            <span className="w-3 h-3 rounded-full bg-[#10b981] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                            Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] rounded-full px-2.5 py-0.5 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]"></span>
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] rounded-full px-2.5 py-0.5 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                            Todo
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[220px]">{t.title}</div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{t.description}</div>
                        )}
                      </td>
                      <td className="py-3">
                        {project ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }}></span>
                            {project.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          t.priority === 'high'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : t.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[11px] ${isTaskOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setModalData({
                            isOpen: true,
                            title: t.title,
                            data: [t],
                            columns: [
                              { header: 'Title', accessor: item => item.title },
                              { header: 'Status', accessor: item => item.status },
                              { header: 'Priority', accessor: item => item.priority },
                              { header: 'Project', accessor: item => project?.name || 'None' },
                              { header: 'Due Date', accessor: item => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' },
                              { header: 'Description', accessor: item => item.description || 'No description provided.' }
                            ]
                          })}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
                          title="View task details"
                        >
                          ···
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No tasks found. Click "New Task" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailsModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        title={modalData.title}
        data={modalData.data}
        columns={modalData.columns}
      />
    </div>
  );
};

export default DashboardPage;
