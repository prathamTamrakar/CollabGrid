import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  hashed_password: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema, 'users');

export function createUserDocument({ id, name, email, hashedPassword, createdAt }) {
  const now = new Date().toISOString();
  return {
    id: id || uuidv4(),
    name: name ? name.trim() : '',
    email: email ? email.trim().toLowerCase() : '',
    hashed_password: hashedPassword,
    created_at: createdAt || now
  };
}

export function sanitizeUser(user) {
  if (!user) return null;
  const doc = user._doc || user;
  return {
    id: doc.id || doc._id,
    name: doc.name,
    email: doc.email,
    created_at: doc.created_at
  };
}
