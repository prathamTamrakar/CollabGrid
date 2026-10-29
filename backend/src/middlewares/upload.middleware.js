import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/chat');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sanitize project_id to avoid directory traversal
    const safeProjectId = (req.params.project_id || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const projectFolder = path.join(UPLOADS_DIR, safeProjectId);
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }
    cb(null, projectFolder);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename prefix with sanitized original extension
    const ext = path.extname(file.originalname).slice(0, 10);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}-${safeBase}${ext}`);
  }
});

// Limit file size to 25MB
export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});
