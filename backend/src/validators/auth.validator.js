export function validateRegister(req) {
  const { name, email, password } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return 'Name is required';
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Valid email is required';
  if (!password || typeof password !== 'string' || password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateLogin(req) {
  const { email, username, password } = req.body || {};
  const identifier = email || username;
  if (!identifier) return 'Email is required';
  if (!password) return 'Password is required';
  return null;
}

export function validateForgotPassword(req) {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Valid email is required';
  return null;
}

export function validateVerifyOtp(req) {
  const { email, otp } = req.body || {};
  if (!email || !email.includes('@')) return 'Valid email is required';
  if (!otp || String(otp).trim().length !== 6) return 'Valid 6-digit OTP is required';
  return null;
}

export function validateResetPassword(req) {
  const { email, otp, new_password, newPassword } = req.body || {};
  const pwd = new_password || newPassword;
  if (!email || !email.includes('@')) return 'Valid email is required';
  if (!otp || String(otp).trim().length !== 6) return 'Valid 6-digit OTP is required';
  if (!pwd || typeof pwd !== 'string' || pwd.length < 6) return 'New password must be at least 6 characters';
  return null;
}
