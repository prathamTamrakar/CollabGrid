import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { ForgotPassword } from './ForgotPassword.jsx';

export const AuthForm = () => {
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
      const result = await register(formData.name, formData.email, formData.password);
      if (!result.success) {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-8 min-h-90 max-h-[42rem] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <img src="/logo.png" alt="CollabGrid logo" className="h-12 w-auto object-contain" />
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

export default AuthForm;
