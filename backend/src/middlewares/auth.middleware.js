import { verifyAccessToken } from '../utils/token.util.js';
import { findUserById } from '../repositories/user.repository.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }

  req.user = user;
  next();
}
