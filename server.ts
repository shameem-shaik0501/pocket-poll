import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { configureCorsAndSecurity } from './middleware/corsAndSecurity.js';
import { apiRouter } from './routes/api.js';
import { connectDB } from './db.js';
import { initializeDatabase } from './pollService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Parsers & Security
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  configureCorsAndSecurity(app);

  // API Routes
  app.use('/api', apiRouter);

  // Attempt DB Connection & Seeding (safe fallback if no credentials)
  try {
    const dbResult = await connectDB();
    if (dbResult.connected) {
      await initializeDatabase();
    } else {
      console.log('⏳ [Pocket Poll] MongoDB Atlas connection will retry in the background...');
      const retryTimer = setInterval(async () => {
        try {
          const res = await connectDB();
          if (res.connected) {
            console.log('🎉 [Pocket Poll] MongoDB Atlas connection established!');
            await initializeDatabase();
            clearInterval(retryTimer);
          }
        } catch {
          // Keep retrying quietly
        }
      }, 15000);
    }
  } catch (err: any) {
    console.warn('Database initialization note:', err?.message || err);
  }

  // Frontend Serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      configFile: path.join(rootDir, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Pocket Poll] Server live on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
