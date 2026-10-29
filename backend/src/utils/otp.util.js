import crypto from 'crypto';

export function generateSecureOtp(length = 6) {
  // Cryptographically secure numeric OTP generation
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

export function getOtpExpirationDate(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return Date.now() > expiry.getTime();
}
