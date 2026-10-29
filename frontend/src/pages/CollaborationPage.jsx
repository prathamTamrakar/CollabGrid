import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import Whiteboard from '../Components/whiteboard/Whiteboard.jsx';
import {
  getCollaborativeProjects,
  getPendingInvites,
  sendInvite,
  acceptInvite,
  declineInvite,
  searchUsers
} from '../services/collaboration.service.js';
import {
  getProjectCollaborators,
  getProjectInvites
} from '../services/project.service.js';

const CollaborationPage = ({ setCurrentView }) => {
  const [projects, setProjects] = useState([]);
  const [invites, setInvites] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteLoading, setInviteLoading] = useState({});
  const [responding, setResponding] = useState({});
  const [whiteboardProject, setWhiteboardProject] = useState(null);
  const { user, token } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [celebrate, setCelebrate] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projectDetails, setProjectDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, invitesData] = await Promise.all([
          getCollaborativeProjects().catch(err => {
            console.error('Failed to load collaborative projects:', err);
            return [];
          }),
          getPendingInvites().catch(err => {
            console.error('Failed to load invites:', err);
            return [];
          })
        ]);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setInvites(Array.isArray(invitesData) ? invitesData : []);
      } catch (err) {
        console.error('Error fetching collaboration data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const data = await searchUsers(search.trim());
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleInvite = async (userId) => {
    if (!selectedProjectId) {
      setErrorMsg('Please select a project to invite to.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setInviteLoading(l => ({ ...l, [userId]: true }));
    try {
      await sendInvite(selectedProjectId, userId);
      const res2 = await getPendingInvites();
      setInvites(Array.isArray(res2) ? res2 : []);
      setSuccessMsg("Invitation sent successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setErrorMsg("");
    } catch (err) {
      let msg = "Failed to send invite.";
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 3000);
    }
    setInviteLoading(l => ({ ...l, [userId]: false }));
  };

  const handleRespond = async (inviteId, accept) => {
    setResponding(r => ({ ...r, [`${inviteId}_${accept ? 'accept' : 'decline'}`]: true }));
    try {
      if (accept) {
        await acceptInvite(inviteId);
      } else {
        await declineInvite(inviteId);
      }
      setInvites(invites => invites.filter(inv => inv.id !== inviteId));
      if (accept) {
        const res1 = await getCollaborativeProjects();
        const updatedProjects = Array.isArray(res1) ? res1 : [];
        setProjects(updatedProjects);
        const myId = user?.id || user?._id;
        const newProject = updatedProjects.find(
          p => p.collaborators && p.collaborators.some(c => String(c) === String(myId)) && !projects.some(old => old.id === p.id)
        );
        if (newProject) {
          setCelebrate({ projectName: newProject.name, ownerName: newProject.owner_name });
          setTimeout(() => setCelebrate(null), 5000);
        }
      }
    } catch (err) {
      console.error('Failed to respond to invite:', err);
    }
    setResponding(r => ({ ...r, [`${inviteId}_${accept ? 'accept' : 'decline'}`]: false }));
  };

  const fetchProjectDetails = async (projectId) => {
    setLoadingDetails(ld => ({ ...ld, [projectId]: true }));
    try {
      const [collabRes, inviteRes] = await Promise.all([
        getProjectCollaborators(projectId).catch(() => []),
        getProjectInvites(projectId).catch(() => [])
      ]);
      setProjectDetails(pd => ({
        ...pd,
        [projectId]: {
          collaborators: Array.isArray(collabRes) ? collabRes : [],
          invites: Array.isArray(inviteRes) ? inviteRes.filter(i => i.status === 'pending') : [],
        }
      }));
    } catch (err) {
      console.error('Failed to fetch project details:', err);
    }
    setLoadingDetails(ld => ({ ...ld, [projectId]: false }));
  };

  if (whiteboardProject) {
    return <Whiteboard project={whiteboardProject} token={token} onBack={() => setWhiteboardProject(null)} />;
  }

  const myUserId = user?.id || user?._id;
  const userOwnedProjects = projects.filter(p => String(p.user_id) === String(myUserId));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Team Collaboration</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Invite team members to workspaces, manage project access, and launch interactive whiteboards
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-sm text-emerald-800 shadow-xs animate-in fade-in">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</span>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3 text-sm text-rose-800 shadow-xs animate-in fade-in">
          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">✕</span>
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Top 2-Column: Invite Teammates + Pending Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Invite Teammates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366f1] flex items-center justify-center font-bold">
              ✉
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Invite Members</h3>
              <p className="text-xs text-slate-500">Add collaborators to your owned workspaces</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              >
                <option value="">Select a project you own...</option>
                {userOwnedProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 bg-[#6366f1] hover:bg-[#5254e0] active:scale-98 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Find User'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50/50">
                {searchResults.map(u => {
                  const targetProject = projects.find(p => p.id === selectedProjectId);
                  const isOwner = targetProject && String(targetProject.user_id) === String(u.id);
                  const isCollaborator = targetProject && Array.isArray(targetProject.collaborators) && targetProject.collaborators.some(c => String(c) === String(u.id));
                  const alreadyInvited = invites.some(inv => String(inv.to_user_id) === String(u.id) && inv.project_id === selectedProjectId && inv.status === 'pending');

                  return (
                    <div key={u.id} className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#6366f1] flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>

                      <div>
                        {isOwner || isCollaborator ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Already in Project
                          </span>
                        ) : alreadyInvited ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Invite Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInvite(u.id)}
                            disabled={inviteLoading[u.id]}
                            className="px-3.5 py-1.5 bg-[#6366f1] hover:bg-[#5254e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                          >
                            {inviteLoading[u.id] ? 'Inviting...' : '+ Invite'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Pending Invitations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pending Invitations</h3>
                <p className="text-xs text-slate-500">Invitations received from other team leads</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {invites.length}
            </span>
          </div>

          {invites.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-lg mb-2">
                📭
              </div>
              <p className="text-xs text-slate-500 font-medium">No pending invitations right now.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">When teammates invite you to their workspace, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map(inv => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-[#6366f1] flex items-center justify-center font-bold text-xs">
                      {inv.from_user_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{inv.from_user_name}</div>
                      <div className="text-[11px] text-slate-500">{inv.from_user_email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(inv.id, true)}
                      disabled={responding[`${inv.id}_accept`]}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                      {responding[`${inv.id}_accept`] ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespond(inv.id, false)}
                      disabled={responding[`${inv.id}_decline`]}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {responding[`${inv.id}_decline`] ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Collaborative Workspaces & Whiteboards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Your Collaborative Projects</h3>
            <p className="text-xs text-slate-500 mt-0.5">Projects you own or participate in with live collaboration tools</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-[#6366f1] rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-lg">
              👥
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">No collaborative projects yet</h4>
            <p className="text-xs text-slate-500 mb-4">Create a project or accept an invitation to begin working together</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => {
              const isOwner = String(p.user_id) === String(myUserId);
              const isExpanded = expandedProjectId === p.id;
              const details = projectDetails[p.id];

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Top Row: Name & Owner Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">{p.name}</h4>
                        <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          Lead: <strong className="text-slate-700">{p.owner_name}</strong>
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isOwner ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isOwner ? 'Owner' : 'Collaborator'}
                      </span>
                    </div>

                    <div className="flex-1"></div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setWhiteboardProject(p)}
                        className="flex-1 py-2 px-3 bg-[#6366f1] hover:bg-[#5254e0] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Open Whiteboard</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedProjectId(null);
                          } else {
                            setExpandedProjectId(p.id);
                            if (!projectDetails[p.id]) fetchProjectDetails(p.id);
                          }
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        title={isExpanded ? 'Hide team info' : 'View team info'}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Expandable Collaborator Info */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
                        {loadingDetails[p.id] ? (
                          <div className="text-center py-2 text-xs text-slate-400">Loading team members...</div>
                        ) : (
                          <>
                            <div>
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Collaborators ({details?.collaborators?.length || 0})
                              </div>
                              {details?.collaborators?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {details.collaborators.map(c => (
                                    <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">No collaborators added yet.</p>
                              )}
                            </div>

                            {isOwner && details?.invites?.length > 0 && (
                              <div className="pt-2">
                                <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-1">
                                  Pending Invites ({details.invites.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {details.invites.map(i => (
                                    <span key={i.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-200/60">
                                      {i.to_user_name || i.user_name || i.to_user_id}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Welcome Celebration Modal */}
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-100 relative animate-in zoom-in-95">
            <button
              onClick={() => setCelebrate(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center absolute top-3 right-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Welcome to the Team!</h3>
            <p className="text-xs text-slate-500 mb-2">You have joined <strong className="text-slate-800">{celebrate.projectName}</strong></p>
            <p className="text-[11px] text-slate-400">Project Leader: {celebrate.ownerName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPage;
