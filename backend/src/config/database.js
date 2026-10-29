import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { config } from './env.js';
import { UserModel } from '../models/user.model.js';
import { TaskModel } from '../models/task.model.js';
import { ProjectModel } from '../models/project.model.js';
import { InvitationModel } from '../models/invitation.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { ChatMessageModel } from '../models/chat.model.js';
import { WhiteboardModel } from '../models/whiteboard.model.js';
import { CalendarEventModel } from '../models/calendar.model.js';
import { PasswordResetOtpModel, RegistrationOtpModel } from '../models/otp.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const defaultCollections = {
  users: [],
  tasks: [],
  projects: [],
  invites: [],
  notifications: [],
  whiteboards: [],
  project_chat_messages: [],
  calendar_events: [],
  otps: [],
  registration_otps: []
};

let isMongo = false;
let localStore = null;
const localCollections = new Map();

function matchesQuery(item, query = {}) {
  for (const key of Object.keys(query)) {
    const qVal = query[key];
    const itemVal = item[key];

    if (key === '$or' && Array.isArray(qVal)) {
      const matchAny = qVal.some(subQ => matchesQuery(item, subQ));
      if (!matchAny) return false;
      continue;
    }

    if (qVal && typeof qVal === 'object' && !Array.isArray(qVal) && !(qVal instanceof Date)) {
      if ('$ne' in qVal && itemVal === qVal['$ne']) return false;
      if ('$lt' in qVal) {
        const target = qVal['$lt'] instanceof Date ? qVal['$lt'].toISOString() : qVal['$lt'];
        const val = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(val < target)) return false;
      }
      if ('$gt' in qVal) {
        const target = qVal['$gt'] instanceof Date ? qVal['$gt'].toISOString() : qVal['$gt'];
        const val = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(val > target)) return false;
      }
      if ('$in' in qVal) {
        if (!Array.isArray(qVal['$in'])) return false;
        if (Array.isArray(itemVal)) {
          if (!itemVal.some(v => qVal['$in'].includes(v))) return false;
        } else {
          if (!qVal['$in'].includes(itemVal)) return false;
        }
      }
      if ('$regex' in qVal) {
        const re = new RegExp(qVal['$regex'], qVal['$options'] || '');
        if (!re.test(String(itemVal || ''))) return false;
      }
      continue;
    }

    if (Array.isArray(itemVal) && !Array.isArray(qVal)) {
      if (!itemVal.includes(qVal)) return false;
      continue;
    }

    if (itemVal !== qVal) return false;
  }
  return true;
}

function initLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      localStore = { ...defaultCollections, ...JSON.parse(raw) };
    } catch (e) {
      console.error('[DB] Error parsing existing db.json, initializing fresh store:', e.message);
      localStore = { ...defaultCollections };
    }
  } else {
    localStore = { ...defaultCollections };
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  }
}

async function saveLocalStore() {
  try {
    if (!localStore) return;
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Failed to save local db:', e);
  }
}

function createLocalCollection(name) {
  function getItems() {
    if (!localStore[name]) {
      localStore[name] = [];
    }
    return localStore[name];
  }

  return {
    name,
    find: (query = {}) => {
      const items = getItems();
      let result = items.filter(item => matchesQuery(item, query));

      return {
        sort: (field, order = 1) => {
          result.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            if (aVal < bVal) return order === -1 ? 1 : -1;
            if (aVal > bVal) return order === -1 ? -1 : 1;
            return 0;
          });
          return {
            to_list: async (limit) => (limit ? result.slice(0, limit) : result),
            toArray: async () => result,
            lean: async () => result
          };
        },
        to_list: async (limit) => (limit ? result.slice(0, limit) : result),
        toArray: async () => result,
        lean: async () => result
      };
    },

    findOne: async (query = {}) => {
      const items = getItems();
      const item = items.find(it => matchesQuery(it, query));
      return item ? JSON.parse(JSON.stringify(item)) : null;
    },

    insertOne: async (doc) => {
      const items = getItems();
      const newDoc = { ...doc };
      if (!newDoc._id) {
        newDoc._id = newDoc.id || String(Date.now() + Math.random());
      }
      items.push(newDoc);
      await saveLocalStore();
      return { insertedId: newDoc._id };
    },

    updateOne: async (filter, update, options = {}) => {
      const items = getItems();
      const index = items.findIndex(it => matchesQuery(it, filter));

      if (index === -1) {
        if (options.upsert) {
          const newDoc = { ...filter };
          if (update.$set) Object.assign(newDoc, update.$set);
          items.push(newDoc);
          await saveLocalStore();
          return { modifiedCount: 1, upsertedId: newDoc._id };
        }
        return { modifiedCount: 0 };
      }

      const item = items[index];
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      if (update.$addToSet) {
        for (const [key, val] of Object.entries(update.$addToSet)) {
          if (!Array.isArray(item[key])) item[key] = [];
          if (!item[key].includes(val)) {
            item[key].push(val);
          }
        }
      }
      await saveLocalStore();
      return { modifiedCount: 1 };
    },

    deleteOne: async (filter) => {
      const items = getItems();
      const index = items.findIndex(it => matchesQuery(it, filter));
      if (index !== -1) {
        items.splice(index, 1);
        await saveLocalStore();
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    deleteMany: async (filter) => {
      const items = getItems();
      const initialLen = items.length;
      const remaining = items.filter(it => !matchesQuery(it, filter));
      localStore[name] = remaining;
      await saveLocalStore();
      return { deletedCount: initialLen - remaining.length };
    },

    countDocuments: async (filter = {}) => {
      const items = getItems();
      return items.filter(it => matchesQuery(it, filter)).length;
    }
  };
}

// Sanitize queries to avoid Mongoose CastErrors when querying string UUIDs against _id
function sanitizeFilter(filter = {}) {
  if (!filter || typeof filter !== 'object') return filter;

  if (Array.isArray(filter)) {
    return filter.map(sanitizeFilter);
  }

  const clean = { ...filter };

  if (clean._id && typeof clean._id === 'string' && !mongoose.isValidObjectId(clean._id)) {
    delete clean._id;
  }

  if (Array.isArray(clean.$or)) {
    const validOr = clean.$or
      .map(sub => sanitizeFilter(sub))
      .filter(sub => sub && typeof sub === 'object' && Object.keys(sub).length > 0);
    if (validOr.length === 0) {
      delete clean.$or;
    } else if (validOr.length === 1) {
      delete clean.$or;
      Object.assign(clean, validOr[0]);
    } else {
      clean.$or = validOr;
    }
  }

  return clean;
}

// Adapt Mongoose model to provide consistent methods
function wrapMongooseModel(model) {
  return {
    name: model.collection.name,
    find: (query = {}) => {
      const sanitized = sanitizeFilter(query);
      const mongooseQuery = model.find(sanitized);
      return {
        sort: (field, order = 1) => {
          const sortObj = typeof field === 'object' ? field : { [field]: order };
          mongooseQuery.sort(sortObj);
          return {
            to_list: async (limit) => (limit ? mongooseQuery.limit(limit).lean() : mongooseQuery.lean()),
            toArray: async () => mongooseQuery.lean(),
            lean: async () => mongooseQuery.lean()
          };
        },
        to_list: async (limit) => (limit ? mongooseQuery.limit(limit).lean() : mongooseQuery.lean()),
        toArray: async () => mongooseQuery.lean(),
        lean: async () => mongooseQuery.lean()
      };
    },
    findOne: async (query = {}) => {
      try {
        const sanitized = sanitizeFilter(query);
        return await model.findOne(sanitized).lean();
      } catch (err) {
        if (err.name === 'CastError') return null;
        throw err;
      }
    },
    insertOne: async (doc) => {
      const created = await model.create(doc);
      return { insertedId: created._id || created.id };
    },
    updateOne: async (filter, update, opts = {}) => {
      const sanitized = sanitizeFilter(filter);
      return model.updateOne(sanitized, update, opts);
    },
    deleteOne: async (filter) => {
      const sanitized = sanitizeFilter(filter);
      return model.deleteOne(sanitized);
    },
    deleteMany: async (filter) => {
      const sanitized = sanitizeFilter(filter);
      return model.deleteMany(sanitized);
    },
    countDocuments: async (filter = {}) => {
      const sanitized = sanitizeFilter(filter);
      return model.countDocuments(sanitized);
    },
    mongooseModel: model
  };
}

export async function initDatabase() {
  const { mongoUrl, dbName, env } = config;

  try {
    await mongoose.connect(mongoUrl, {
      dbName,
      serverSelectionTimeoutMS: 2500
    });
    isMongo = true;
    console.log(`[DB] Connected successfully to MongoDB via Mongoose (${mongoUrl} / ${dbName})`);
  } catch (err) {
    if (env === 'production') {
      console.error(`[DB] FATAL: Failed to connect to MongoDB via Mongoose in production: ${err.message}`);
      throw err;
    }
    console.warn(
      `[DB] Could not connect to MongoDB via Mongoose (${err.message}). Using persistent JSON fallback store at ${DATA_FILE}`
    );
    initLocalStore();
  }
}

export function getDatabase() {
  if (isMongo && mongoose.connection.readyState === 1) {
    return {
      users: wrapMongooseModel(UserModel),
      tasks: wrapMongooseModel(TaskModel),
      projects: wrapMongooseModel(ProjectModel),
      invites: wrapMongooseModel(InvitationModel),
      notifications: wrapMongooseModel(NotificationModel),
      whiteboards: wrapMongooseModel(WhiteboardModel),
      project_chat_messages: wrapMongooseModel(ChatMessageModel),
      calendar_events: wrapMongooseModel(CalendarEventModel),
      otps: wrapMongooseModel(PasswordResetOtpModel),
      registration_otps: wrapMongooseModel(RegistrationOtpModel),
      isMongo: () => true,
      mongoose
    };
  }

  // Local fallback
  const getCol = (name) => {
    if (!localCollections.has(name)) {
      localCollections.set(name, createLocalCollection(name));
    }
    return localCollections.get(name);
  };

  return {
    users: getCol('users'),
    tasks: getCol('tasks'),
    projects: getCol('projects'),
    invites: getCol('invites'),
    notifications: getCol('notifications'),
    whiteboards: getCol('whiteboards'),
    project_chat_messages: getCol('project_chat_messages'),
    calendar_events: getCol('calendar_events'),
    otps: getCol('otps'),
    registration_otps: getCol('registration_otps'),
    isMongo: () => false,
    mongoose
  };
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isMongo = false;
  }
}

export { matchesQuery, mongoose };
