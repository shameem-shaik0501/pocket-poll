/**
 * Pocket Poll - Database Connection Module
 * Connects to MongoDB Atlas using the shameem278700_db_user account.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fall back to default system resolver
}

// Ensure mongoose fails fast and doesn't buffer queries when disconnected
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

// Default cluster configuration for shameem278700_db_user
const DB_USER = process.env.MONGODB_USERNAME || 'shameem278700_db_user';
const DB_CLUSTER = process.env.MONGODB_CLUSTER || 'cluster0.38v7pyb.mongodb.net';
const DB_NAME = process.env.MONGODB_DB_NAME || 'pocket_poll';

export function getMongoURI(customPassword) {
  if (process.env.MONGODB_URI) {
    let uri = process.env.MONGODB_URI.trim().replace(/^["']|["']$/g, '');
    // Ensure the database name is in the connection string
    if (!uri.includes('?') && !uri.match(/mongodb(\+srv)?:\/\/[^\/]+\/.+/)) {
      uri = uri.replace(/\/?$/, `/${DB_NAME}?retryWrites=true&w=majority`);
    } else if (uri.includes('?') && !uri.match(/mongodb(\+srv)?:\/\/[^\/]+\/[^?]+/)) {
      uri = uri.replace('?', `/${DB_NAME}?`);
    }
    return uri;
  }

  const password = (customPassword || process.env.MONGODB_PASSWORD || process.env.DB_PASSWORD || process.env.MONGO_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
  if (!password) {
    // Returns template URI if password not yet provided
    return `mongodb+srv://${DB_USER}:<db_password>@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
  }

  const encodedPassword = encodeURIComponent(password);
  return `mongodb+srv://${DB_USER}:${encodedPassword}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
}

let isConnected = false;
let connectionError = null;

export async function connectDB(overrideUri = null) {
  const uri = overrideUri || getMongoURI();

  if (!uri || uri.includes('<db_password>')) {
    console.warn('⚠️ [MongoDB Atlas] No database password provided yet.');
    console.warn(`Target cluster: mongodb+srv://${DB_USER}:****@${DB_CLUSTER}/${DB_NAME}`);
    isConnected = false;
    connectionError = 'Database password not provided in environment variables (DB_PASSWORD or MONGODB_URI). Running in active fallback memory mode.';
    return { connected: false, error: connectionError, uri };
  }

  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      connectionError = null;
      return { connected: true, uri };
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    connectionError = null;
    console.log(`✅ [MongoDB Atlas] Successfully connected to Cluster0 as ${DB_USER}`);
    return { connected: true, uri };
  } catch (err) {
    isConnected = false;
    connectionError = err.message || 'Failed to connect to MongoDB Atlas cluster';
    console.error('❌ [MongoDB Atlas Connection Error]:', connectionError);
    return { connected: false, error: connectionError, uri };
  }
}

mongoose.connection.on('connected', () => {
  isConnected = true;
  connectionError = null;
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  connectionError = err.message;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

export function getDbStatus() {
  return {
    isConnected: mongoose.connection.readyState === 1 || isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown',
    clusterUser: DB_USER,
    clusterHost: DB_CLUSTER,
    dbName: DB_NAME,
    lastError: connectionError,
  };
}

export default connectDB;
