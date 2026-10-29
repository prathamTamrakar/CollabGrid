import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/kanban_db',
  dbName: process.env.DB_NAME || 'kanban_db',
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production' ? null : 'supersecretkanbankey2026taskflow!'),
  jwtExpirationHours: parseInt(process.env.JWT_EXPIRATION_HOURS, 10) || 72,
  sendgridApiKey: process.env.SENDGRID_API_KEY || null,
  fromEmail: process.env.FROM_EMAIL || null,
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/+$/, ''))
    : [
        (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/+$/, ''),
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      ]
};

export function validateEnv() {
  if (config.env === 'production') {
    const missing = [];
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    if (!process.env.MONGO_URL) missing.push('MONGO_URL');

    if (missing.length > 0) {
      throw new Error(
        `[CONFIG] FATAL: Missing required production environment variable(s): ${missing.join(', ')}`
      );
    }
  }
}
