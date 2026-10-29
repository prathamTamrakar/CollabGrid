import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import logo from './assets/logoicon.png';
import debounce from 'lodash.debounce';
import CustomSelect from './Components/CustomSelect';
import CalendarPage from './Components/CalendarPage';
import FeatureModal from './Components/FeatureModal';

const BACKEND_URL = process.env.VITE_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password });
      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpStep, setOtpStep] = useState(0);
  const [otpToken, setOtpToken] = useState('');
  const [otp, setOtp] = useState('');

  const passwordRules = [
    {
      label: 'At least 8 characters',
      test: (pw) => pw.length >= 8,
    },
    {
      label: 'One capital letter',
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      label: 'One or more numbers',
      test: (pw) => /[0-9]/.test(pw),
    },
    {
      label: 'Four or more lowercase letters',
      test: (pw) => (pw.match(/[a-z]/g) || []).length >= 4,
    },
  ];

  const passwordValid = passwordRules.every(rule => rule.test(formData.password));
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin) {
      if (!passwordValid) {
        setError('Password does not meet requirements.');
        setLoading(false);
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      // Direct registration (OTP flow commented out as requested)
      const result = await register(formData.name, formData.email, formData.password);
      if (!result.success) {
        setError(result.error);
      }
      setLoading(false);
      return;

      /* --- OTP Flow (Commented Out) ---
      try {
        const res = await axios.post(`${API}/auth/register-request-otp`, {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        setOtpToken(res.data.otp_token);
        if (res.data.dev_otp) {
          setOtp(res.data.dev_otp);
        }
        setOtpStep(1);
        setError('');
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed');
      }
      setLoading(false);
      return;
      ---------------------------------- */
    }

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  /* --- OTP Verification Handler (Commented Out) ---
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/register-verify-otp`, {
        email: formData.email,
        otp,
        otp_token: otpToken
      });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      window.location.reload(); 
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed');
    }
    setLoading(false);
  };
  ------------------------------------------------ */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) {
    return <ForgotPassword onBackToLogin={() => setShowForgot(false)} />;
  }

  /* --- OTP Step 1 Modal (Commented Out) ---
  if (otpStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 min-h-90 max-h-[35rem] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img src={logo} alt="logo" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h2>
            <p className="text-gray-600">Enter the OTP sent to your email address</p>
          </div>
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                placeholder="Enter the OTP"
              />
              <p className="text-xs text-gray-500 mt-2">Didn't get the email? Please check your <span className='font-semibold'>Spam</span> or <span className='font-semibold'>Promotions</span> folder in Gmail.</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50">{loading ? 'Please wait...' : 'Verify OTP & Create Account'}</button>
            <button type="button" onClick={() => { setOtpStep(0); setOtp(''); setOtpToken(''); }} className="w-full text-blue-600 hover:text-black-700 font-medium p-2 no-gradient">Back</button>
          </form>
        </div>
      </div>
    );
  }
  ---------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-8 min-h-90 max-h-[42rem] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white mx-auto mb-3 flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Collab<span className="text-indigo-600">Grid</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin ? 'Sign in to access your projects & tasks' : 'Create an account to start collaborating'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                required={!isLogin}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12"
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-4 text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            {!isLogin && (touched.password || formData.password) && (
              <ul className="mt-2 space-y-1 text-sm">
                {passwordRules.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={rule.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                      {rule.test(formData.password) ? (
                        <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </span>
                    <span className={rule.test(formData.password) ? 'text-gray-800' : 'text-gray-500'}>{rule.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-4 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {touched.confirmPassword && formData.confirmPassword && !passwordsMatch && (
                <div className="text-red-600 text-xs mt-1">Passwords do not match</div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!passwordValid || !passwordsMatch))}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-3 px-4 rounded-xl font-medium shadow-sm hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', password: '', confirmPassword: '' }); setTouched({ password: false, confirmPassword: false }); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 transition-colors block w-full"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          {isLogin && (
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 transition-colors block w-full"
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading CollabGrid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App modern-cozy-bg">
      {!user ? <AuthForm /> : <Dashboard />}
      <FeatureModal />
    </div>
  );
};

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/tasks`)
      ]);

      setStats(statsRes.data);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'tasks':
        return <TaskManager tasks={tasks} setTasks={setTasks} fetchDashboardData={fetchDashboardData} />;
      case 'projects':
        return <ProjectManager projects={projects} setProjects={setProjects} fetchDashboardData={fetchDashboardData} />;
      case 'collaboration':
        return <Collaboration setCurrentView={setCurrentView} />;
      case 'notifications':
        return <Notifications setCurrentView={setCurrentView} />;
      case 'calendar':
        return <CalendarPage />;
      default:
        return <DashboardHome stats={stats} projects={projects} tasks={tasks} setCurrentView={setCurrentView} />;
    }
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClick = (e) => {
      if (e.target.closest('.mobile-sidebar') || e.target.closest('.burger-btn')) return;
      setSidebarOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen]);

  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CG';

  const getViewTitle = (view) => {
    switch (view) {
      case 'dashboard': return 'Dashboard Overview';
      case 'tasks': return 'Tasks & Kanban';
      case 'projects': return 'Projects';
      case 'collaboration': return 'Team Collaboration';
      case 'notifications': return 'Notifications';
      case 'calendar': return 'Calendar & Schedule';
      default: return 'CollabGrid';
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

  return (
    <div className="flex h-screen bg-[#fafbfc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* Permanent Desktop Left Sidebar matching Visual Style */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-slate-100 flex-col flex-shrink-0 select-none justify-between z-20">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Workspace Switcher Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                CG
              </div>
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isActive
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
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

        {/* Sidebar Footer: Dark mode toggle & User profile card */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
          {/* User Profile Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-indigo-100">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate leading-tight">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate leading-tight">{user.email}</div>
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

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-64 bg-white shadow-2xl p-4 flex flex-col justify-between h-full z-10 animate-slide-in">
            <div className="overflow-y-auto flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                <span className="font-bold text-sm text-slate-900">CollabGrid</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  ✕
                </button>
              </div>
              <nav className="space-y-4">
                {navSections.map((section, sidx) => (
                  <div key={sidx}>
                    <div className="text-[10px] font-semibold text-slate-400 tracking-wider pb-1 px-2">{section.title}</div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${currentView === item.id ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500'
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
              <button onClick={() => { logout(); setSidebarOpen(false); }} className="w-full text-xs font-medium text-red-600 flex items-center justify-center gap-2 py-2">
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content View with Top Action Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-100 h-16 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                {getViewTitle(currentView)}
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">CollabGrid Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell Button */}
            <button
              onClick={() => setCurrentView('notifications')}
              className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative transition"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            </button>

            {/* Primary Action Button: + New Task */}
            <button
              onClick={() => setCurrentView('tasks')}
              className="inline-flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, title, data, columns }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                {columns.map((col, index) => (
                  <th key={index} className="px-3 py-2">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data && data.length > 0 ? data.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/60 transition">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-3 py-2.5 text-slate-800">
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-6 text-slate-400">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ stats, projects, tasks, setCurrentView }) => {
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
                    className={`px-3 py-1 rounded-lg transition-all ${timeView === tab
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
                        // Find any real task whose due date or update matches this day or distribute tasks cleanly
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
                                className={`p-1.5 rounded-xl text-[11px] cursor-pointer hover:shadow-xs transition border leading-tight ${taskForSlot.status === 'done'
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${t.priority === 'high'
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

const TaskManager = ({ tasks, setTasks, fetchDashboardData }) => {
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
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
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
        await axios.put(`${API}/tasks/${editingTask.id}`, taskData);
      } else {
        await axios.post(`${API}/tasks`, taskData);
      }

      await fetchDashboardData();
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
        await axios.delete(`${API}/tasks/${taskId}`);
        await fetchDashboardData();
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
      setTasks(updatedTasks);
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to update task status:', error);
      await fetchDashboardData();
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
    setTasks(newTasks);

    try {
      await axios.put(`${API}/tasks/${task.id}`, { status: newStatus });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to update task drag status:', err);
      await fetchDashboardData();
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'kanban'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
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
                        className={`flex-1 space-y-3 transition-colors rounded-xl p-1 ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
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
                                    className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[#6366f1] rotate-1' : ''
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
                                      className={`text-sm font-semibold text-slate-900 leading-snug mb-1.5 ${task.status === 'done' ? 'line-through text-slate-400' : ''
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
                                            className={`inline-flex items-center gap-1 font-medium ${overdue ? 'text-rose-600 font-semibold' : 'text-slate-400'
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
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${formData.priority === p
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

const ProjectManager = ({ projects, setProjects, fetchDashboardData }) => {
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
      const response = await axios.get(`${API}/projects/${selectedProject.id}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch project tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, formData);
      } else {
        await axios.post(`${API}/projects`, formData);
      }

      await fetchDashboardData();
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
        await axios.delete(`${API}/projects/${projectId}`);
        await fetchDashboardData();
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

      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
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
      await axios.put(`${API}/tasks/${task.id}`, { status: destination.droppableId });
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
                          className={`flex-1 space-y-3 transition-colors rounded-xl p-1 ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
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
                                    className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[#6366f1] rotate-1' : ''
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

                                    <h5 className={`text-sm font-semibold text-slate-900 leading-snug mb-1 ${task.status === 'done' ? 'line-through text-slate-400' : ''
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
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${formData.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
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

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [serverOtpToken, setServerOtpToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmNewPassword: false });

  const passwordRules = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One capital letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One or more numbers', test: (pw) => /[0-9]/.test(pw) },
    { label: 'Four or more lowercase letters', test: (pw) => (pw.match(/[a-z]/g) || []).length >= 4 },
  ];
  const passwordValid = passwordRules.every(rule => rule.test(newPassword));
  const passwordsMatch = newPassword === confirmNewPassword;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      setServerOtpToken(res.data.otp_token);
      if (res.data.dev_otp) {
        setOtp(res.data.dev_otp);
      }
      setStep(2);
      setSuccessMsg('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, { email, otp, otp_token: serverOtpToken });
      setServerOtpToken(res.data.otp_token);
      setStep(3);
      setSuccessMsg('OTP verified. You can now reset your password.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    if (!passwordValid) {
      setError('Password does not meet requirements.'); setLoading(false); return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.'); setLoading(false); return;
    }
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email, otp_token: serverOtpToken, new_password: newPassword
      });
      setSuccessMsg('Password reset successful! You can now log in.');
      setTimeout(() => { onBackToLogin(); }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-8 min-h-90 max-h-[38rem] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white mx-auto mb-3 flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-gray-600">{step === 1 ? 'Enter your registered email' : step === 2 ? 'Enter the OTP sent to your email' : 'Reset your password'}</p>
        </div>
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" placeholder="Enter your registered email" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{successMsg}</div>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 px-4 rounded-xl font-medium shadow-sm hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition duration-150 disabled:opacity-50">{loading ? 'Please wait...' : 'Send OTP'}</button>
            <button type="button" onClick={onBackToLogin} className="w-full text-blue-600 hover:text-black-700 font-medium p-2 no-gradient">Back to Login</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
              <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" placeholder="Enter the OTP" />
              <p className="text-xs text-gray-500 mt-2">Didn't get the email? Please check your <span className='font-semibold'>Spam</span> or <span className='font-semibold'>Promotions</span> folder in Gmail.</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{successMsg}</div>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 px-4 rounded-xl font-medium shadow-sm hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition duration-150 disabled:opacity-50">{loading ? 'Please wait...' : 'Verify OTP'}</button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-blue-600 hover:text-black-700 font-medium p-2 no-gradient">Back</button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} name="newPassword" required value={newPassword} onChange={e => setNewPassword(e.target.value)} onBlur={handleBlur} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12" placeholder="Enter new password" autoComplete="new-password" />
                <button type="button" tabIndex={-1} className="absolute right-3 top-4 text-gray-400 hover:text-gray-700 focus:outline-none" onClick={() => setShowNewPassword(v => !v)} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="black" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="black" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {(touched.newPassword || newPassword) && (
                <ul className="mt-2 space-y-1 text-sm">
                  {passwordRules.map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className={rule.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                        {rule.test(newPassword) ? (
                          <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </span>
                      <span className={rule.test(newPassword) ? 'text-gray-800' : 'text-gray-500'}>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmNewPassword" required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} onBlur={handleBlur} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12" placeholder="Re-enter new password" autoComplete="new-password" />
                <button type="button" tabIndex={-1} className="absolute right-3 top-4 text-gray-400 hover:text-gray-700 focus:outline-none" onClick={() => setShowConfirmPassword(v => !v)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              {touched.confirmNewPassword && confirmNewPassword && !passwordsMatch && (
                <div className="text-red-600 text-xs mt-1">Passwords do not match</div>
              )}
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{successMsg}</div>}
            <button type="submit" disabled={loading || !passwordValid || !passwordsMatch} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 px-4 rounded-xl font-medium shadow-sm hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition duration-150 disabled:opacity-50">{loading ? 'Please wait...' : 'Reset Password'}</button>
            <button type="button" onClick={onBackToLogin} className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium p-2 transition-colors">Back to Login</button>
          </form>
        )}
      </div>
    </div>
  );
};

const Collaboration = ({ setCurrentView }) => {
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
        const res1 = await axios.get(`${API}/collaboration/projects`);
        setProjects(res1.data);
      } catch { }
      try {
        const res2 = await axios.get(`${API}/collaboration/invites`);
        setInvites(res2.data);
      } catch { }
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
      const res = await axios.get(`${API}/users/search?query=${encodeURIComponent(search)}`);
      setSearchResults(res.data);
    } catch {
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
      await axios.post(`${API}/collaboration/invite`, { user_id: userId, project_id: selectedProjectId });
      const res2 = await axios.get(`${API}/collaboration/invites`);
      setInvites(res2.data);
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
      await axios.post(`${API}/collaboration/invite/${inviteId}/${accept ? 'accept' : 'decline'}`);
      setInvites(invites => invites.filter(inv => inv.id !== inviteId));
      if (accept) {
        const res1 = await axios.get(`${API}/collaboration/projects`);
        setProjects(res1.data);
        const newProject = res1.data.find(p => p.collaborators && p.collaborators.includes(user.id) && !projects.some(old => old.id === p.id));
        if (newProject) {
          setCelebrate({ projectName: newProject.name, ownerName: newProject.owner_name });
          setTimeout(() => setCelebrate(null), 5000);
        }
      }
    } catch { }
    setResponding(r => ({ ...r, [`${inviteId}_${accept ? 'accept' : 'decline'}`]: false }));
  };

  const fetchProjectDetails = async (projectId) => {
    setLoadingDetails(ld => ({ ...ld, [projectId]: true }));
    try {
      const [collabRes, inviteRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/collaborators`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/projects/${projectId}/invites`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProjectDetails(pd => ({
        ...pd,
        [projectId]: {
          collaborators: collabRes.data,
          invites: inviteRes.data.filter(i => i.status === 'pending'),
        }
      }));
    } catch { }
    setLoadingDetails(ld => ({ ...ld, [projectId]: false }));
  };

  if (whiteboardProject) {
    return <Whiteboard project={whiteboardProject} token={token} onBack={() => setWhiteboardProject(null)} />;
  }

  const userOwnedProjects = projects.filter(p => p.user_id === user.id);

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
                  const isOwner = targetProject && targetProject.user_id === u.id;
                  const isCollaborator = targetProject && targetProject.collaborators && targetProject.collaborators.includes(u.id);
                  const alreadyInvited = invites.some(inv => inv.to_user_id === u.id && inv.project_id === selectedProjectId && inv.status === 'pending');

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
              const isOwner = p.user_id === user.id;
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isOwner ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
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
                                      {i.user_name || i.to_user_id}
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

const Notifications = ({ setCurrentView }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const { user } = useAuth();
  const [projectMap, setProjectMap] = useState({});

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/notifications`);
        setNotifications(res.data);
      } catch (err) {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API}/collaboration/projects`);
        const map = {};
        res.data.forEach(p => { map[p.id] = p.name; });
        setProjectMap(map);
      } catch { }
    };
    fetchProjects();
  }, [user]);

  const handleMarkRead = async (notif_id) => {
    setMarking(m => ({ ...m, [notif_id]: true }));
    try {
      await axios.post(`${API}/notifications/${notif_id}/read`);
      setNotifications(n => n.map(notif => notif.id === notif_id ? { ...notif, status: 'read' } : notif));
    } catch (err) { }
    setMarking(m => ({ ...m, [notif_id]: false }));
  };

  const handleDeleteNotification = async (notif_id) => {
    try {
      await axios.delete(`${API}/notifications/${notif_id}`);
      setNotifications(n => n.filter(nf => nf.id !== notif_id));
    } catch (err) {
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await axios.delete(`${API}/notifications/read/all`);
      setNotifications(n => n.filter(notif => notif.status !== 'read'));
    } catch (err) {
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => n.status === 'unread').map(n => axios.post(`${API}/notifications/${n.id}/read`))
      );
      setNotifications(n => n.map(notif => ({ ...notif, status: 'read' })));
    } catch (err) { }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'read') return n.status === 'read';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6366f1] text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Stay up to date with project invitations and activity</p>
        </div>

        {/* Bulk action buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={handleDeleteAllRead}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Clear read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === 'all'
            ? 'bg-[#6366f1] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === 'unread'
            ? 'bg-[#6366f1] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === 'read'
            ? 'bg-[#6366f1] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-[#6366f1] rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-lg">
            🔔
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">All caught up!</h4>
          <p className="text-xs text-slate-500">You don't have any notifications in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notif => {
            const isUnread = notif.status === 'unread';
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isUnread
                  ? 'bg-white border-indigo-200/80 shadow-xs'
                  : 'bg-slate-50/50 border-slate-200/70'
                  }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${isUnread ? 'bg-indigo-50 text-[#6366f1]' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {isUnread ? '📬' : '📄'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                        {notif.message}
                      </span>
                      {notif.related_project_id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {projectMap[notif.related_project_id] || 'Workspace'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={marking[notif.id]}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {marking[notif.id] ? 'Saving...' : 'Mark read'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
    const ws = new window.WebSocket(`${BACKEND_URL.replace('http', 'ws')}/api/ws/chat/${project.id}?token=${token}`);
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
      const res = await axios.post(`/api/chat/${project.id}/upload`, formData, {
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
            <div key={msg.id} className={`message_card rounded-2xl px-3 py-2 border-2 shadow-sm ${msg.user_id === user.id ? 'bg-green-50 border-green-400 text-right ml-8' : 'bg-gray-50 border-gray-400 text-left mr-8'} ${msg.deleted ? 'opacity-60 italic' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800 text-sm px-2 py-1">{msg.user_name}{msg.user_id === user.id && ' (You)'}</span>
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
              {!msg.deleted && msg.user_id === user.id && editingId !== msg.id && (
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
          {/* <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded"
            onClick={() => audioInputRef.current && audioInputRef.current.click()}
            disabled={uploading}
            title="Send voice note"
            style={{ minWidth: 40 }}
          >🎤</button> */}
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
    const ws = new window.WebSocket(`${API.replace('http', 'ws')}/ws/whiteboard/${project.id}?token=${token}`);
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
    ctx.lineTo(to.x, to.y);
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
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
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

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}