import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL, API_URL as API, getWebSocketUrl } from '../../services/api.js';

function ChatSidebar({ open, onClose, project, token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [uploading, setUploading] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef();
  const audioInputRef = useRef();

  useEffect(() => {
    if (open && project && token) {
      axios.get(`${API}/chat/${project.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setMessages(res.data || []));
    }
  }, [open, project, token]);

  useEffect(() => {
    if (!open || !project || !token) return;
    const ws = new window.WebSocket(getWebSocketUrl(`/api/ws/chat/${project.id}?token=${token}`));
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'message') {
        setMessages(m => [...m, msg.message]);
      } else if (msg.type === 'edit') {
        setMessages(m => m.map(x => x.id === msg.id ? { ...x, content: msg.content, edited: true } : x));
      } else if (msg.type === 'delete') {
        setMessages(m => m.map(x => x.id === msg.id ? { ...x, deleted: true, content: "" } : x));
      }
    };
    return () => ws.close();
  }, [open, project, token]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'text', content: input }));
    setInput("");
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditingText(msg.content);
  };
  const saveEdit = () => {
    if (!editingText.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'edit', id: editingId, content: editingText }));
    setEditingId(null);
    setEditingText("");
  };
  const deleteMsg = (id) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'delete', id }));
  };

  const sendFile = async (file, type) => {
    if (!file || !project || !token) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/chat/${project.id}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type,
          content: res.data.url,
          file_name: res.data.file_name,
        }));
      }
    } catch (err) {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) sendFile(file, 'file');
    e.target.value = '';
  };
  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) sendFile(file, 'voice');
    e.target.value = '';
  };

  return (
    <div>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'bg-black/20 pointer-events-auto' : 'pointer-events-none bg-transparent'}`}
        style={{ display: open ? 'block' : 'none' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 pb-4 h-full w-[380px] max-w-full bg-white shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: open ? '-4px 0 24px 0 rgba(0,0,0,0.12)' : 'none' }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg text-blue-700">Project Chat</span>
          <button className="text-gray-500 px-2 mt-0 py-0 pb-1 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 120px)' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`message_card rounded-2xl px-3 py-2 border-2 shadow-sm ${msg.user_id === user?.id ? 'bg-green-50 border-green-400 text-right ml-8' : 'bg-gray-50 border-gray-400 text-left mr-8'} ${msg.deleted ? 'opacity-60 italic' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800 text-sm px-2 py-1">{msg.user_name}{msg.user_id === user?.id && ' (You)'}</span>
                <span className="text-xs text-gray-400 ml-2">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{msg.edited && !msg.deleted ? ' (edited)' : ''}</span>
              </div>
              {editingId === msg.id ? (
                <div className="flex flex-col md:flex-row gap-2 mt-1 items-end w-full">
                  <textarea
                    className="flex-1 border px-3 py-2 text-sm resize-y min-h-[40px] max-h-40 focus:outline-blue-400 bg-white shadow-sm"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    rows={Math.max(2, editingText.split('\n').length)}
                    style={{ overflow: 'auto' }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button className="text-xs px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md" onClick={saveEdit}>Save</button>
                    <button className="text-xs px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all shadow-md" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : msg.deleted ? (
                <span className="text-gray-400 italic">(deleted)</span>
              ) : msg.type === 'file' ? (
                <div className="mt-1 text-sm">
                  <a href={`${(BACKEND_URL + msg.content).replace(/([^:]\/)\/+/, '$1/')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" download={msg.file_name || true}>
                    <span className="inline-block align-middle mr-1">📎</span>{msg.file_name || 'Download file'}
                  </a>
                </div>
              ) : msg.type === 'voice' ? (
                <div className="mt-1">
                  <audio controls src={`${(BACKEND_URL + msg.content).replace(/([^:]\/)\/+/, '$1/')}`} className="w-full" />
                  <div className="text-xs text-gray-400">{msg.file_name || 'Voice note'}</div>
                </div>
              ) : (
                <div className="mt-1 text-sm break-words">{msg.content}</div>
              )}
              {!msg.deleted && msg.user_id === user?.id && editingId !== msg.id && (
                <div className="flex gap-2 justify-end mt-1">
                  <button className="text-xs px-3 py-1 rounded-full bg-red text-red-700 font-semibold hover:bg-red-200 transition-all shadow-sm" onClick={() => startEdit(msg)}>Edit</button>
                  <button className="text-xs px-3 py-1 rounded-full bg-red text-red-700 font-semibold hover:bg-red-200 transition-all shadow-sm" onClick={() => deleteMsg(msg.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t flex gap-2 bg-white items-center flex-wrap md:flex-nowrap pb-6">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-blue-400 min-w-0"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            disabled={!!editingId || uploading}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            title="Send file"
            style={{ minWidth: 40 }}
          >📎</button>
          <input
            type="file"
            accept="audio/*"
            ref={audioInputRef}
            style={{ display: 'none' }}
            onChange={handleAudioChange}
            disabled={uploading}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold whitespace-nowrap shadow-md transition-all"
            onClick={sendMessage}
            disabled={!input.trim() || !!editingId || uploading}
            style={{ minWidth: 64 }}
          >Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar;
