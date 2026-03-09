import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { adminRoutes } from './routes/adminRoutes';
import { authRoutes } from './routes/authRoutes';
import { docsRoutes } from './routes/docsRoutes';
import { itemRoutes } from './routes/itemRoutes';
import { apiRateLimit } from './middleware/rateLimit';
import { orderRoutes } from './routes/orderRoutes';
import { ownerRoutes } from './routes/ownerRoutes';
import { storeRoutes } from './routes/storeRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { seedDatabase } from './services/seedService';

export async function startServer() {
  await connectDatabase();
  await seedDatabase();

  const app = express();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.locals.io = io;
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
    if (allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(uploadsDir));
  app.use('/api', apiRateLimit);

  app.use('/docs', docsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api', orderRoutes);
  app.use('/api', ownerRoutes);
  app.use('/api', adminRoutes);

  app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server] unhandled error', {
      method: req.method,
      path: req.path,
      message: error?.message,
      stack: error?.stack,
    });
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  });

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${env.port}`);
  });
}
