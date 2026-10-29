import { config } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow non-browser requests (curl, server-to-server, Postman, mobile apps)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');

    const allowedList = (
      Array.isArray(config.corsOrigins) ? config.corsOrigins : [config.corsOrigins]
    )
      .filter(Boolean)
      .map(o => (typeof o === 'string' ? o.trim().replace(/\/+$/, '') : o));

    if (config.frontendUrl) {
      const normalizedFrontend = config.frontendUrl.trim().replace(/\/+$/, '');
      if (!allowedList.includes(normalizedFrontend)) {
        allowedList.push(normalizedFrontend);
      }
    }

    // 2. Allow if wildcard '*' is configured or in development
    if (
      allowedList.includes('*') ||
      allowedList.includes(true) ||
      config.env !== 'production'
    ) {
      return callback(null, true);
    }

    // 3. Exact origin match
    if (allowedList.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 4. Match Vercel subdomains (*.vercel.app), Render (*.onrender.com), Netlify (*.netlify.app)
    if (
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.endsWith('.onrender.com') ||
      normalizedOrigin.endsWith('.netlify.app') ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // 5. Safe rejection without throwing unhandled Error in Express
    console.warn(
      `[CORS] Blocked request from origin: ${origin}. Allowed origins:`,
      allowedList
    );
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
};

export default corsOptions;
