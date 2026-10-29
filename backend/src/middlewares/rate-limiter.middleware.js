// In-memory sliding-window rate limiter
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 20,
  message = 'Too many requests, please try again later.'
} = {}) {
  const requests = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(time => now - time < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function rateLimiterMiddleware(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const clientTimestamps = (requests.get(ip) || []).filter(time => now - time < windowMs);

    if (clientTimestamps.length >= maxRequests) {
      return res.status(429).json({ detail: message });
    }

    clientTimestamps.push(now);
    requests.set(ip, clientTimestamps);
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 10,
  message: 'Too many OTP requests. Please wait a few minutes before trying again.'
});
