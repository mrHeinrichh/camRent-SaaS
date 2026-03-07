import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { adminRoutes } from './routes/adminRoutes';
import { authRoutes } from './routes/authRoutes';
import { docsRoutes } from './routes/docsRoutes';
import { itemRoutes } from './routes/itemRoutes';
import { orderRoutes } from './routes/orderRoutes';
import { ownerRoutes } from './routes/ownerRoutes';
import { storeRoutes } from './routes/storeRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { seedDatabase } from './services/seedService';

export async function startServer() {
  await connectDatabase();
  await seedDatabase();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.locals.io = io;
  app.use(express.json({ limit: '10mb' }));

  app.use('/docs', docsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api', orderRoutes);
  app.use('/api', ownerRoutes);
  app.use('/api', adminRoutes);

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${env.port}`);
  });
}
