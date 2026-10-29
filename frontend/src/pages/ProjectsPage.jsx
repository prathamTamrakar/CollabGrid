import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getProjectById, createProject, updateProject, deleteProject } from '../services/project.service.js';
import { updateTask } from '../services/task.service.js';

const ProjectsPage = ({ projects = [], setProjects, fetchDashboardData }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchProjectQuery, setSearchProjectQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks();
    }
  }, [selectedProject]);

  const fetchProjectTasks = async () => {
    if (!selectedProject) return;
    try {
      const data = await getProjectById(selectedProject.id);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch project tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
      } else {
        await createProject(formData);
      }

      if (fetchDashboardData) await fetchDashboardData();
      resetForm();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#6366f1'
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      try {
        await deleteProject(projectId);
        if (fetchDashboardData) await fetchDashboardData();
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null);
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      await updateTask(taskId, { status: newStatus });
      await fetchProjectTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      await fetchProjectTasks();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366f1'
    });
    setEditingProject(null);
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

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 text-slate-700', dotColor: 'bg-slate-400' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-indigo-50 text-indigo-700', dotColor: 'bg-indigo-500' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50 text-emerald-700', dotColor: 'bg-emerald-500' }
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

    const task = tasks.find((t) => String(t.id) === String(draggableId));
    if (!task) return;

    let newTasks = [...tasks];
    newTasks = newTasks.filter((t) => String(t.id) !== String(draggableId));
    const destTasks = newTasks.filter((t) => t.status === destination.droppableId);
    const otherTasks = newTasks.filter((t) => t.status !== destination.droppableId);
    const updatedTask = { ...task, status: destination.droppableId };
    destTasks.splice(destination.index, 0, updatedTask);
    setTasks([...otherTasks, ...destTasks]);

    try {
      await updateTask(task.id, { status: destination.droppableId });
      await fetchProjectTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      await fetchProjectTasks();
    }
  };

  const filteredProjects = projects.filter(p =>
    !searchProjectQuery ||
    p.name?.toLowerCase().includes(searchProjectQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchProjectQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* View 1: When a project is selected (Dedicated Project Kanban View) */}
      {selectedProject ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Breadcrumb & Project Header */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setTasks([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Projects</span>
              </button>

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full shadow-xs"
                  style={{ backgroundColor: selectedProject.color || '#6366f1' }}
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedProject.name}</h2>
                  {selectedProject.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedProject.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(selectedProject)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Project</span>
              </button>
            </div>
          </div>

          {/* Dedicated Project Kanban Board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {columns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.id);
                return (
                  <div key={column.id} className="bg-slate-100/60 rounded-2xl border border-slate-200/80 p-4 min-h-[460px] flex flex-col">
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`}></span>
                        <h4 className="font-semibold text-sm text-slate-800">{column.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${column.color}`}>
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-3 transition-colors rounded-xl p-1 ${
                            snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          {columnTasks.length === 0 ? (
                            <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                              No tasks in this stage
                            </div>
                          ) : (
                            columnTasks.map((task, index) => (
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
                                    <div className="flex items-center justify-between mb-2">
                                      {getPriorityBadge(task.priority)}
                                      {isOverdue(task.due_date, task.status) && (
                                        <span className="text-[10px] bg-rose-50 text-rose-600 font-semibold px-1.5 py-0.5 rounded-full border border-rose-200/60">
                                          Overdue
                                        </span>
                                      )}
                                    </div>

                                    <h5 className={`text-sm font-semibold text-slate-900 leading-snug mb-1 ${
                                      task.status === 'done' ? 'line-through text-slate-400' : ''
                                    }`}>
                                      {task.title}
                                    </h5>

                                    {task.description && (
                                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {task.description}
                                      </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                                      <span className="text-slate-400 text-[11px]">
                                        {task.due_date ? formatDate(task.due_date) : 'No due date'}
                                      </span>

                                      <select
                                        value={task.status}
                                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                        className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 focus:outline-none"
                                      >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
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
        </div>
      ) : (
        /* View 2: Projects Overview Grid */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Projects & Workspaces</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage workspaces, track milestones and access project Kanban boards</p>
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
              <span>Add Project</span>
            </button>
          </div>

          {/* Search toolbar */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchProjectQuery}
                onChange={(e) => setSearchProjectQuery(e.target.value)}
                placeholder="Search projects by name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
              />
            </div>
            <div className="text-xs font-medium text-slate-500">
              Total <span className="font-semibold text-slate-800">{filteredProjects.length}</span> projects
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                <div className="w-12 h-12 bg-indigo-50 text-[#6366f1] rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-lg">
                  📁
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No projects found</h3>
                <p className="text-xs text-slate-500 mb-4">Create your first project to organize tasks and collaborate</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#6366f1] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#5254e0] transition-all"
                >
                  Create Project
                </button>
              </div>
            ) : (
              filteredProjects.map(project => {
                const accentColor = project.color || '#6366f1';
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
                  >
                    {/* Color Accent Bar */}
                    <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                            style={{ backgroundColor: accentColor }}
                          >
                            {project.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#6366f1] transition-colors leading-tight">
                              {project.name}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              Created {formatDate(project.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(project);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                        {project.description || 'No description provided for this project.'}
                      </p>

                      {/* Bottom action trigger */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                          Open Kanban Board
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-slate-50 group-hover:bg-[#6366f1] group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modern Create / Edit Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: formData.color || '#6366f1' }}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '📁'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure project details and identity</p>
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
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mobile App Redesign"
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
                  placeholder="Goals, timeline, or notes for this project..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-3">
                  {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        formData.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
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
                  {loading ? 'Saving...' : (editingProject ? 'Save Changes' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
