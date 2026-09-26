/**
 * Vercel Serverless Entry Point for Pocket Poll API
 * Handles all /api/* requests
 */

import express from 'express';
import { configureCorsAndSecurity } from '../middleware/corsAndSecurity.js';
import { apiRouter } from '../routes/api.js';
import { connectDB } from '../db.js';
import { initializeDatabase } from '../pollService.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
configureCorsAndSecurity(app);

// Lazy DB init (safe for serverless cold starts)
let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  try {
    await connectDB();
    await initializeDatabase();
    dbReady = true;
  } catch (err: any) {
    console.warn('DB init note:', err?.message || err);
  }
}

app.use(async (_req, _res, next) => {
  await ensureDb();
  next();
});

// Mount API router
app.use('/api', apiRouter);

// Fallback: also accept paths without the /api prefix
// (in case Vercel rewrite strips it)
app.use(apiRouter);

export default app;
