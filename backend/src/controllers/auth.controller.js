import * as authService from '../services/auth.service.js';
import { success } from '../utils/api-response.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerDirect(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function requestRegistrationOtp(req, res, next) {
  try {
    const result = await authService.requestRegistrationOtp(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyRegistrationOtp(req, res, next) {
  try {
    const result = await authService.verifyRegistrationOtp(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const { id, name, email, created_at } = req.user;
    return success(res, {
      id: id || req.user._id,
      name,
      email,
      created_at
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.requestForgotPasswordOtp(req.body.email);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyPasswordResetOtp(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, otp, new_password, newPassword } = req.body;
    const result = await authService.resetPassword({
      email,
      otp,
      newPassword: new_password || newPassword
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  login,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword
};
