import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middlewares/rate-limiter.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword
} from '../validators/auth.validator.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', authRateLimiter, validate(validateRegister), authController.register);

// POST /api/auth/register-request-otp
router.post('/register-request-otp', otpRateLimiter, validate(validateRegister), authController.requestRegistrationOtp);

// POST /api/auth/register-verify-otp
router.post('/register-verify-otp', otpRateLimiter, validate(validateVerifyOtp), authController.verifyRegistrationOtp);

// POST /api/auth/login
router.post('/login', authRateLimiter, validate(validateLogin), authController.login);

// GET /api/auth/me
router.get('/me', requireAuth, authController.getMe);

// POST /api/auth/forgot-password
router.post('/forgot-password', otpRateLimiter, validate(validateForgotPassword), authController.forgotPassword);

// POST /api/auth/verify-otp
router.post('/verify-otp', otpRateLimiter, validate(validateVerifyOtp), authController.verifyOtp);

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, validate(validateResetPassword), authController.resetPassword);

export default router;
