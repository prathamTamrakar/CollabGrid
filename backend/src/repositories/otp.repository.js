import { getDatabase } from '../config/database.js';

// --- Password Reset OTPs ---

export async function savePasswordResetOtp({ email, otp, expiresAt }) {
  const db = getDatabase();
  // Remove prior pending OTPs for this email to enforce single valid OTP
  await db.otps.deleteMany({ email });
  const entry = {
    email,
    otp,
    expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    used: false,
    created_at: new Date().toISOString()
  };
  await db.otps.insertOne(entry);
  return entry;
}

export async function findLatestPasswordResetOtp(email) {
  const db = getDatabase();
  const otps = await db.otps.find({ email, used: { $ne: true } }).sort('created_at', -1).to_list(1);
  return otps[0] || null;
}

export async function markPasswordResetOtpUsed(email, otp) {
  const db = getDatabase();
  return db.otps.updateOne(
    { email, otp },
    { $set: { used: true, used_at: new Date().toISOString() } }
  );
}

// --- Registration OTPs ---

export async function saveRegistrationOtp({ email, name, hashedPassword, otp, expiresAt }) {
  const db = getDatabase();
  await db.registration_otps.deleteMany({ email });
  const entry = {
    email,
    name,
    hashed_password: hashedPassword,
    otp,
    expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    used: false,
    created_at: new Date().toISOString()
  };
  await db.registration_otps.insertOne(entry);
  return entry;
}

export async function findLatestRegistrationOtp(email) {
  const db = getDatabase();
  const otps = await db.registration_otps.find({ email, used: { $ne: true } }).sort('created_at', -1).to_list(1);
  return otps[0] || null;
}

export async function markRegistrationOtpUsed(email, otp) {
  const db = getDatabase();
  return db.registration_otps.updateOne(
    { email, otp },
    { $set: { used: true, used_at: new Date().toISOString() } }
  );
}
