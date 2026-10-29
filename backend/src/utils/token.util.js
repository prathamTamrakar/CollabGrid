import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    return 'supersecretkanbankey2026taskflow!';
  }
  return secret;
}

function getJwtExpiration() {
  return `${process.env.JWT_EXPIRATION_HOURS || 72}h`;
}

export function createAccessToken(userId) {
  if (!userId) {
    throw new Error('User ID is required to create an access token');
  }
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: getJwtExpiration()
  });
}

export function verifyAccessToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}

export { getJwtSecret, getJwtExpiration };
