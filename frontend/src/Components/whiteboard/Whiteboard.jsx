import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useAuth } from '../../hooks/useAuth.js';
import { API_URL as API, getWebSocketUrl } from '../../services/api.js';
import ChatSidebar from '../chat/ChatSidebar.jsx';

const Whiteboard = ({ project, token, onBack }) => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [last, setLast] = useState(null);
  const [actions, setActions] = useState([]);
  const savingRef = useRef(false);
  const [color, setColor] = useState('#222');
  const [width, setWidth] = useState(2);
  const [invites, setInvites] = useState([]);
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const whiteboardBgColorRef = useRef('#ffffff');
  const [whiteboardBgColor, setWhiteboardBgColor] = useState('#ffffff');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const openLeftSidebar = () => { setLeftSidebarOpen(true); setChatOpen(false); };
  const closeLeftSidebar = () => setLeftSidebarOpen(false);
  const openChatSidebar = () => { setChatOpen(true); setLeftSidebarOpen(false); };

  useEffect(() => {
    if (!project || !token || !user || user.id !== project.user_id) return;
    axios.get(`${API}/projects/${project.id}/invites`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setInvites(res.data)).catch(() => setInvites([]));
  }, [project, token, user]);

  useEffect(() => {
    if (!project || !token) return;
    axios.get(`${API}/projects/${project.id}/collaborators`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setCollaborators(res.data)).catch(() => setCollaborators([]));
  }, [project, token]);

  useEffect(() => {
    if (!project) return;
    axios.get(`${API}/whiteboard/${project.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      let actionsArr = [];
      let bgColor = '#ffffff';
      if (res.data && typeof res.data === 'object' && Array.isArray(res.data.actions)) {
        actionsArr = res.data.actions;
        bgColor = res.data.bgColor || '#ffffff';
      } else if (Array.isArray(res.data)) {
        actionsArr = res.data;
      }
      setActions(actionsArr);
      setWhiteboardBgColor(bgColor);
      setTimeout(() => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, 800, 500);
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, 800, 500);
          actionsArr.forEach(act => {
            ctx.strokeStyle = act.color || '#222';
            ctx.lineWidth = act.width || 2;
            ctx.beginPath();
            ctx.moveTo(act.from.x, act.from.y);
            ctx.lineTo(act.to.x, act.to.y);
            ctx.stroke();
          });
        }
      }, 100);
    });
  }, [project, token]);

  const redraw = (acts) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = whiteboardBgColorRef.current;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    acts.forEach(act => {
      ctx.strokeStyle = act.color || '#222';
      ctx.lineWidth = act.width || 2;
      ctx.beginPath();
      ctx.moveTo(act.from.x, act.from.y);
      ctx.lineTo(act.to.x, act.to.y);
      ctx.stroke();
    });
  };

  useEffect(() => {
    whiteboardBgColorRef.current = whiteboardBgColor;
    redraw(actions);
  }, [actions]);

  const debouncedSendBgColor = useRef(
    debounce((color) => {
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'bgcolor', color }));
      }
    }, 200)
  ).current;

  const debouncedSaveBgColor = useRef(
    debounce((color, actions) => {
      if (!project || !token) return;
      axios.post(`${API}/whiteboard/${project.id}`, { actions, bgColor: color }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }, 3000)
  ).current;

  const handleBgColorChange = (e) => {
    const color = e.target.value;
    if (color === whiteboardBgColorRef.current) return;
    setWhiteboardBgColor(color);
    whiteboardBgColorRef.current = color;
    redraw(actions);
    debouncedSendBgColor(color);
    debouncedSaveBgColor(color, actions);
  };

  const saveActions = (newActions) => {
    if (savingRef.current) return;
    savingRef.current = true;
    axios.post(`${API}/whiteboard/${project.id}`, newActions, {
      headers: { Authorization: `Bearer ${token}` }
    }).finally(() => {
      savingRef.current = false;
    });
  };

  useEffect(() => {
    if (actions.length > 0) saveActions(actions);
  }, [actions]);

  useEffect(() => {
    if (!project || !token) return;
    const ws = new window.WebSocket(getWebSocketUrl(`/api/ws/whiteboard/${project.id}?token=${token}`));
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'draw' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = msg.color || '#222';
        ctx.lineWidth = msg.width || 2;
        ctx.beginPath();
        ctx.moveTo(msg.from.x, msg.from.y);
        ctx.lineTo(msg.to.x, msg.to.y);
        ctx.stroke();
        setActions(a => [...a, msg]);
      } else if (msg.type === 'presence' && Array.isArray(msg.onlineUserIds)) {
        setOnlineUserIds(msg.onlineUserIds);
      } else if (msg.type === 'undo') {
        setActions(a => {
          const newActs = a.slice(0, -1);
          setTimeout(() => redraw(newActs), 0);
          return newActs;
        });
      } else if (msg.type === 'clear') {
        setActions([]);
        setTimeout(() => redraw([]), 0);
      } else if (msg.type === 'bgcolor') {
        if ((msg.color || '#ffffff') !== whiteboardBgColorRef.current) {
          setWhiteboardBgColor(msg.color || '#ffffff');
          whiteboardBgColorRef.current = msg.color || '#ffffff';
          redraw(actions);
        }
      }
    };
    return () => ws.close();
  }, [project, token]);

  const sendDraw = (from, to) => {
    const act = { type: 'draw', from, to, color, width };
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(act));
    }
    setActions(a => [...a, act]);
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    setLast(getPos(e));
  };
  const handleMouseUp = () => setDrawing(false);
  const handleMouseMove = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    if (last && pos) {
      drawLine(last, pos);
      sendDraw(last, pos);
      setLast(pos);
    }
  };
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const drawLine = (from, to) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(from.x, from.y);
    ctx.stroke();
  };

  const handleUndo = () => {
    if (actions.length === 0) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'undo' }));
    }
  };

  const handleClear = () => {
    if (actions.length === 0) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }));
    }
  };

  useEffect(() => {
    if (actions.length > 0 || actions.length === 0) redraw(actions);
  }, [actions]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = whiteboardBgColorRef.current;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `whiteboard-${project?.name || 'export'}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const actionsRef = useRef(actions);
  useEffect(() => { actionsRef.current = actions; }, [actions]);

  useEffect(() => {
    redraw(actions);
  }, [actions, whiteboardBgColor]);

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    setDrawing(true);
    const touch = e.touches[0];
    setLast(getTouchPos(touch));
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    const touch = e.touches[0];
    const pos = getTouchPos(touch);
    if (last && pos) {
      drawLine(last, pos);
      sendDraw(last, pos);
      setLast(pos);
    }
  };
  const handleTouchEnd = (e) => {
    e.preventDefault();
    setDrawing(false);
  };
  const getTouchPos = (touch) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  return (
    <div className="flex flex-col items-center py-8 w-full pt-0 mt-0 relative">
      <button
        className="sidebar-btn fixed top-20 right-4 z-50 bg-white text-black rounded-full shadow-lg p-2 flex items-center justify-center transition-all duration-200 md:top-20 md:right-8"
        style={{ boxShadow: '0 4px 16px 0 rgba(80, 63, 63, 0.1)' }}
        onClick={openChatSidebar}
        aria-label="Open Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" className="w-6 h-6" style={{ color: 'black' }}>
          <path d="M5 19l2.5-2.5H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2h.5V19z" stroke="black" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          <circle cx="8.5" cy="11" r="1" fill="black" />
          <circle cx="12" cy="11" r="1" fill="black" />
          <circle cx="15.5" cy="11" r="1" fill="black" />
        </svg>
      </button>
      <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} project={project} token={token} user={user} />
      <div className="w-full flex flex-col items-center mb-6 mt-0 px-2">
        <div className="flex flex-col md:flex-row w-full justify-between items-center max-w-5xl mx-auto gap-3">
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit Whiteboard</span>
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{project.name} — Live Canvas</h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {connected ? 'Live Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full justify-center items-start gap-5 max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center flex-1 w-full">
          {/* Floating Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm px-4 py-2.5 mb-4 border border-slate-200/90 w-full max-w-3xl">
            <button
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={handleUndo}
              disabled={actions.length === 0}
            >
              ↶ Undo
            </button>
            <button
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-40"
              onClick={handleClear}
              disabled={actions.length === 0}
            >
              🗑 Clear
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Color:</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-7 h-7 p-0 border border-slate-300 rounded-lg cursor-pointer bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Size:</label>
              <input
                type="range"
                min="1"
                max="12"
                value={width}
                onChange={e => setWidth(Number(e.target.value))}
                className="w-20 accent-[#6366f1]"
              />
              <span className="text-xs font-bold text-slate-600 min-w-[24px]">{width}px</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Canvas:</label>
              <input
                type="color"
                value={whiteboardBgColor}
                onChange={handleBgColorChange}
                className="w-7 h-7 p-0 border border-slate-300 rounded-lg cursor-pointer bg-transparent"
              />
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <button
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#5254e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              onClick={handleExport}
            >
              Export PNG
            </button>
          </div>

          <div className="w-full flex justify-center">
            <canvas
              ref={canvasRef}
              width={Math.min(800, window.innerWidth - 32)}
              height={window.innerWidth < 768 ? Math.max(320, window.innerHeight * 0.45) : 500}
              className="rounded-2xl border border-slate-200/90 shadow-sm max-w-full h-auto min-h-[320px] md:min-h-[500px]"
              style={{ touchAction: 'none', maxWidth: '100%', height: 'auto' }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseOut={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 text-center w-full">
            All collaborators see updates in real time. Drawings sync and save automatically.
          </div>
        </div>

        {/* Right Rail: Collaborators & Invites */}
        <div className="flex flex-col items-stretch gap-4 w-full md:w-64">
          <div className="bg-white rounded-2xl shadow-xs p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Live Members</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <ul className="space-y-2">
              {collaborators.map(userObj => {
                const isOnline = onlineUserIds.map(String).includes(String(userObj.id));
                return (
                  <li key={userObj.id} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate">{userObj.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{userObj.email}</div>
                    </div>
                  </li>
                );
              })}
              {collaborators.length === 0 && <li className="text-slate-400 text-xs">No collaborators found.</li>}
            </ul>
          </div>

          {user && project && user.id === project.user_id && invites.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-slate-200/80">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                Pending Invites
              </div>
              <ul className="space-y-2">
                {invites.filter(i => i.status === 'pending').map(i => (
                  <li key={i.id} className="flex items-center justify-between text-xs">
                    <div className="truncate min-w-0 pr-2">
                      <span className="font-medium text-slate-800">{i.user_name}</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <button
        className="sidebar-btn fixed top-20 left-4 z-50 bg-white text-black rounded-full shadow-lg p-2 flex items-center justify-center transition-all duration-200 md:top-20 md:left-8"
        style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)' }}
        onClick={openLeftSidebar}
        aria-label="Open Tasks"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" className="w-6 h-6" style={{ color: 'black' }}>
          <rect x="7" y="4" width="10" height="16" rx="2" stroke="black" strokeWidth="1.5" fill="none" />
          <path d="M9 8h6M9 12h6M9 16h2" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={`fixed top-0 left-0 h-full w-[380px] max-w-full bg-white shadow-2xl z-50 transition-transform duration-300 ${leftSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}`}
        style={{ boxShadow: '-4px 0 24px 0 rgba(0,0,0,0.12)' }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg text-blue-700">Tasks</span>
          <button className="text-gray-500 px-2 mt-0 py-0 pb-1 hover:text-blue-600 text-2xl font-bold" onClick={closeLeftSidebar}>&times;</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-xl text-gray-600 font-semibold">
          Tasks Management Section Coming soon.
        </div>
      </div>
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 bg-black/20 pointer-events-auto"
          onClick={closeLeftSidebar}
        />
      )}
    </div>
  );
};

export default Whiteboard;
