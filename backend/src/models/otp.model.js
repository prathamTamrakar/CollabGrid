import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  expires_at: { type: String, required: true },
  used: { type: Boolean, default: false },
  used_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

const registrationOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  name: { type: String, required: true, trim: true },
  hashed_password: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: String, required: true },
  used: { type: Boolean, default: false },
  used_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const PasswordResetOtpModel =
  mongoose.models.PasswordResetOtp ||
  mongoose.model('PasswordResetOtp', passwordResetOtpSchema, 'otps');

export const RegistrationOtpModel =
  mongoose.models.RegistrationOtp ||
  mongoose.model('RegistrationOtp', registrationOtpSchema, 'registration_otps');
