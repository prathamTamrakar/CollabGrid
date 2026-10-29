import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Valid plain password required for hashing');
  }
  const digest = sha256(plainPassword);
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(digest, salt);
}

export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  const digest = sha256(plainPassword);

  // 1. Try matching bcrypt of sha256 digest (current project standard)
  try {
    if (await bcrypt.compare(digest, hashedPassword)) {
      return true;
    }
  } catch (err) {
    // ignore
  }

  // 2. Try direct bcrypt comparison for standard bcrypt hashes
  try {
    if (await bcrypt.compare(plainPassword, hashedPassword)) {
      return true;
    }
  } catch (err) {
    // ignore
  }

  // Security: Plaintext password fallback has been completely removed to prevent authentication bypass.
  return false;
}

export { sha256 };
