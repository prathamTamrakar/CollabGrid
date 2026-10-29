import { config } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = Array.isArray(config.corsOrigins)
      ? config.corsOrigins
      : [config.corsOrigins];

    if (allowed.includes(true) || allowed.includes(origin) || config.env !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export default corsOptions;
