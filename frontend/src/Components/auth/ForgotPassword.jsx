import React, { useState } from 'react';
import { requestForgotPassword, verifyOtp, resetPassword } from '../../services/auth.service.js';

export const ForgotPassword = ({ onBackToLogin }) => {
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
      const res = await requestForgotPassword(email);
      setServerOtpToken(res.otp_token);
      if (res.dev_otp) {
        setOtp(res.dev_otp);
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
      const res = await verifyOtp(email, otp, serverOtpToken);
      setServerOtpToken(res.otp_token || serverOtpToken);
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
      await resetPassword({
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
          <div className="flex items-center justify-center mb-3">
            <img src="/logo.png" alt="CollabGrid logo" className="h-12 w-auto object-contain" />
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

export default ForgotPassword;
