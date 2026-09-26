/**
 * Pocket Poll - Middleware: CORS & Security Configurations
 * Connects the Vercel Frontend to the Render Express Backend
 */

import cors from 'cors';

export function configureCorsAndSecurity(app) {
  // Allowed origins: Vercel production & preview deployments, local dev, and custom env
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter(Boolean);

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('.run.app'); // AI Studio runtime

      if (isAllowed) {
        callback(null, true);
      } else {
        // Fallback to allow for cross-site voting if configured
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  // Enable CORS
  app.use(cors(corsOptions));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

export default configureCorsAndSecurity;
