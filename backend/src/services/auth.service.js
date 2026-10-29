import AppError from '../utils/app-error.js';
import { hashPassword, verifyPassword } from '../utils/password.util.js';
import { createAccessToken } from '../utils/token.util.js';
import { generateSecureOtp, getOtpExpirationDate, isOtpExpired } from '../utils/otp.util.js';
import { createUserDocument, sanitizeUser } from '../models/user.model.js';
import {
  findUserByEmail,
  createUser,
  updateUser
} from '../repositories/user.repository.js';
import {
  savePasswordResetOtp,
  findLatestPasswordResetOtp,
  markPasswordResetOtpUsed,
  saveRegistrationOtp,
  findLatestRegistrationOtp,
  markRegistrationOtpUsed
} from '../repositories/otp.repository.js';
import { sendEmailOtp } from './email.service.js';

export async function registerDirect({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await hashPassword(password);
  const userDoc = createUserDocument({ name, email, hashedPassword });
  await createUser(userDoc);

  const token = createAccessToken(userDoc.id);

  return {
    access_token: token,
    token_type: 'bearer',
    user: sanitizeUser(userDoc)
  };
}

export async function requestRegistrationOtp({ email, name, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  // Pre-hash password before saving to temporary registration store (Security audit 5)
  const hashedPassword = await hashPassword(password);
  const otp = generateSecureOtp(6);
  const expiresAt = getOtpExpirationDate(10);

  await saveRegistrationOtp({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    hashedPassword,
    otp,
    expiresAt
  });

  await sendEmailOtp({
    toEmail: email,
    subject: 'CollabGrid - Verify Your Email',
    otp,
    registration: true
  });

  return {
    message: 'OTP sent to your email. Please verify to complete registration.'
  };
}

export async function verifyRegistrationOtp({ email, otp }) {
  const cleanEmail = email.trim().toLowerCase();
  const regEntry = await findLatestRegistrationOtp(cleanEmail);

  if (!regEntry || regEntry.otp !== String(otp).trim()) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  if (isOtpExpired(regEntry.expires_at)) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  // Double-check user wasn't registered in the meantime
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  const userDoc = createUserDocument({
    name: regEntry.name,
    email: cleanEmail,
    hashedPassword: regEntry.hashed_password
  });
  await createUser(userDoc);

  // Invalidate OTP (single-use)
  await markRegistrationOtpUsed(cleanEmail, otp);

  const token = createAccessToken(userDoc.id);

  return {
    access_token: token,
    token_type: 'bearer',
    user: sanitizeUser(userDoc)
  };
}

export async function login({ email, username, password }) {
  const identifier = (email || username || '').trim().toLowerCase();
  const user = await findUserByEmail(identifier);

  if (!user) {
    throw new AppError('Incorrect email or password', 401);
  }

  const isValid = await verifyPassword(password, user.hashed_password);
  if (!isValid) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = createAccessToken(user.id);

  return {
    access_token: token,
    token_type: 'bearer',
    user: sanitizeUser(user)
  };
}

export async function requestForgotPasswordOtp(email) {
  const cleanEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }

  const otp = generateSecureOtp(6);
  const expiresAt = getOtpExpirationDate(10);

  await savePasswordResetOtp({
    email: cleanEmail,
    otp,
    expiresAt
  });

  await sendEmailOtp({
    toEmail: cleanEmail,
    subject: 'CollabGrid - Password Reset OTP',
    otp,
    registration: false
  });

  return {
    message: 'OTP sent to your email. Please check your inbox.'
  };
}

export async function verifyPasswordResetOtp({ email, otp }) {
  const cleanEmail = email.trim().toLowerCase();
  const otpEntry = await findLatestPasswordResetOtp(cleanEmail);

  if (!otpEntry || otpEntry.otp !== String(otp).trim()) {
    throw new AppError('Invalid OTP', 400);
  }

  if (isOtpExpired(otpEntry.expires_at)) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  return {
    message: 'OTP verified successfully'
  };
}

export async function resetPassword({ email, otp, newPassword }) {
  const cleanEmail = email.trim().toLowerCase();
  const otpEntry = await findLatestPasswordResetOtp(cleanEmail);

  if (!otpEntry || otpEntry.otp !== String(otp).trim()) {
    throw new AppError('Invalid OTP', 400);
  }

  if (isOtpExpired(otpEntry.expires_at)) {
    throw new AppError('OTP has expired', 400);
  }

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUser(user.id, {
    hashed_password: hashedPassword,
    updated_at: new Date().toISOString()
  });

  // Mark OTP as used to prevent replay attacks
  await markPasswordResetOtpUsed(cleanEmail, otp);

  return {
    message: 'Password reset successful. You can now login with your new password.'
  };
}

export default {
  registerDirect,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  login,
  requestForgotPasswordOtp,
  verifyPasswordResetOtp,
  resetPassword
};
