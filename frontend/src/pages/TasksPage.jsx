import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getProjects } from '../services/project.service.js';
import { createTask, updateTask, deleteTask } from '../services/task.service.js';

const TasksPage = ({ tasks = [], setTasks, fetchDashboardData }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    project_id: '',
    status: 'todo'
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjectsList();
  }, []);

  const fetchProjectsList = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status || 'todo',
        due_date: formData.due_date ? new Date(formData.due_date + 'T12:00:00Z').toISOString() : null,
        project_id: formData.project_id || null
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }

      if (fetchDashboardData) await fetchDashboardData();
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      project_id: task.project_id || '',
      status: task.status || 'todo'
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        if (fetchDashboardData) await fetchDashboardData();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      if (setTasks) setTasks(updatedTasks);
      await updateTask(taskId, { status: newStatus });
      if (fetchDashboardData) await fetchDashboardData();
    } catch (error) {
      console.error('Failed to update task status:', error);
      if (fetchDashboardData) await fetchDashboardData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      project_id: '',
      status: 'todo'
    });
    setEditingTask(null);
    setShowCreateModal(false);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60">Medium</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">Low</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">Normal</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">In Progress</span>;
      case 'todo':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">To Do</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || String(task.project_id) === String(projectFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const kanbanColumns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      dotColor: 'bg-slate-400',
      emptyText: 'No tasks waiting to start'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotColor: 'bg-indigo-500',
      emptyText: 'No tasks currently active'
    },
    {
      id: 'done',
      title: 'Done',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      emptyText: 'No completed tasks yet'
    }
  ];

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => String(t.id) === String(draggableId));
    if (!task) return;

    // Destination is column id: 'todo', 'in_progress', 'done' or 'task-list'
    const newStatus = ['todo', 'in_progress', 'done'].includes(destination.droppableId)
      ? destination.droppableId
      : task.status;

    const updatedTask = { ...task, status: newStatus };
    const newTasks = tasks.map(t => String(t.id) === String(draggableId) ? updatedTask : t);
    if (setTasks) setTasks(newTasks);

    try {
      await updateTask(task.id, { status: newStatus });
      if (fetchDashboardData) await fetchDashboardData();
    } catch (err) {
      console.error('Failed to update task drag status:', err);
      if (fetchDashboardData) await fetchDashboardData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks & Workflow</h2>
          <p className="text-sm text-slate-500 mt-0.5">Organize, prioritize, and track your daily work across projects</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366f1] hover:bg-[#5254e0] active:scale-98 text-white rounded-xl text-sm font-semibold shadow-xs transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by name or description..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredTasks.length}</span> of {tasks.length} tasks
        </div>
      </div>

      {/* Main View: Kanban vs List */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {kanbanColumns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="bg-slate-100/60 rounded-2xl border border-slate-200/80 p-4 flex flex-col min-h-[460px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                      <h3 className="font-semibold text-sm text-slate-800">{col.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${col.color}`}>
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        resetForm();
                        setFormData(prev => ({ ...prev, status: col.id }));
                        setShowCreateModal(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title={`Add task to ${col.title}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Droppable Task Container */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-3 transition-colors rounded-xl p-1 ${
                          snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        {colTasks.length === 0 ? (
                          <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-4">
                            <p className="text-xs text-slate-400 font-medium">{col.emptyText}</p>
                            <button
                              onClick={() => {
                                resetForm();
                                setFormData(prev => ({ ...prev, status: col.id }));
                                setShowCreateModal(true);
                              }}
                              className="mt-2 text-xs font-semibold text-[#6366f1] hover:underline"
                            >
                              + Create a task
                            </button>
                          </div>
                        ) : (
                          colTasks.map((task, index) => {
                            const projectObj = projects.find(p => String(p.id) === String(task.project_id));
                            const overdue = isOverdue(task.due_date, task.status);

                            return (
                              <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${
                                      snapshot.isDragging ? 'shadow-xl ring-2 ring-[#6366f1] rotate-1' : ''
                                    }`}
                                  >
                                    {/* Card Header: Project badge & Priority */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {projectObj && (
                                          <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                                            style={{
                                              backgroundColor: `${projectObj.color || '#6366f1'}15`,
                                              color: projectObj.color || '#6366f1'
                                            }}
                                          >
                                            <span
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{ backgroundColor: projectObj.color || '#6366f1' }}
                                            />
                                            {projectObj.name}
                                          </span>
                                        )}
                                      </div>
                                      {getPriorityBadge(task.priority)}
                                    </div>

                                    {/* Task Title */}
                                    <h4
                                      className={`text-sm font-semibold text-slate-900 leading-snug mb-1.5 ${
                                        task.status === 'done' ? 'line-through text-slate-400' : ''
                                      }`}
                                    >
                                      {task.title}
                                    </h4>

                                    {/* Task Description */}
                                    {task.description && (
                                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Card Footer: Due Date & Actions */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2 text-xs">
                                      <div className="flex items-center gap-1">
                                        {task.due_date ? (
                                          <span
                                            className={`inline-flex items-center gap-1 font-medium ${
                                              overdue ? 'text-rose-600 font-semibold' : 'text-slate-400'
                                            }`}
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(task.due_date)}
                                            {overdue && <span className="ml-1 text-[10px] bg-rose-50 px-1.5 py-0.2 rounded text-rose-600">Overdue</span>}
                                          </span>
                                        ) : (
                                          <span className="text-slate-300 text-[11px]">No due date</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {/* Status quick select */}
                                        <select
                                          value={task.status}
                                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                          className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 focus:outline-none"
                                        >
                                          <option value="todo">To Do</option>
                                          <option value="in_progress">In Progress</option>
                                          <option value="done">Done</option>
                                        </select>

                                        {/* Edit button */}
                                        <button
                                          onClick={() => handleEdit(task)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                          title="Edit task"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                          </svg>
                                        </button>

                                        {/* Delete button */}
                                        <button
                                          onClick={() => handleDelete(task.id)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          title="Delete task"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        /* List Mode View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">Done</th>
                  <th className="py-3.5 px-4">Task</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const projectObj = projects.find(p => String(p.id) === String(task.project_id));
                    const overdue = isOverdue(task.due_date, task.status);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={(e) => handleStatusChange(task.id, e.target.checked ? 'done' : 'todo')}
                            className="w-4 h-4 rounded text-[#6366f1] focus:ring-[#6366f1]/20 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={`font-semibold text-slate-900 ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {projectObj ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${projectObj.color || '#6366f1'}15`,
                                color: projectObj.color || '#6366f1'
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: projectObj.color || '#6366f1' }}
                              />
                              {projectObj.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          {task.due_date ? (
                            <span className={overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                              {formatDate(task.due_date)}
                              {overdue && <span className="ml-1 text-[10px] bg-rose-50 px-1 rounded text-rose-600">Overdue</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Completed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Create / Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#6366f1] flex items-center justify-center font-bold">
                  {editingTask ? '✎' : '+'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h3>
                  <p className="text-xs text-slate-500">Provide details for this task</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Design responsive landing hero"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add notes, requirements, or acceptance criteria..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <div className="flex gap-1.5">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          formData.priority === p
                            ? p === 'high'
                              ? 'bg-rose-50 text-rose-600 border-rose-300'
                              : p === 'medium'
                              ? 'bg-amber-50 text-amber-600 border-amber-300'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign Project
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#6366f1] hover:bg-[#5254e0] shadow-xs active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTask ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
