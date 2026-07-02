import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth';
import { Notification } from '../models/Notification';
import type { AuthedRequest } from '../types/auth';
import { serializeMany, toId } from '../utils/mongo';

export const notificationRoutes = Router();

notificationRoutes.get('/notifications', authenticate, requireAuth, async (req: AuthedRequest, res) => {
  const userId = toId(req.user!.id);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user_id: userId }).sort({ created_at: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user_id: userId, read: false }),
  ]);
  res.json({
    notifications: serializeMany(notifications as any[]),
    unread_count: unreadCount,
  });
});

notificationRoutes.get('/notifications/unread-count', authenticate, requireAuth, async (req: AuthedRequest, res) => {
  const count = await Notification.countDocuments({ user_id: toId(req.user!.id), read: false });
  res.json({ unread_count: count });
});

notificationRoutes.post('/notifications/:id/read', authenticate, requireAuth, async (req: AuthedRequest, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid notification id' });
  await Notification.updateOne(
    { _id: toId(req.params.id), user_id: toId(req.user!.id) },
    { $set: { read: true } },
  );
  res.json({ success: true });
});

notificationRoutes.post('/notifications/read-all', authenticate, requireAuth, async (req: AuthedRequest, res) => {
  await Notification.updateMany({ user_id: toId(req.user!.id), read: false }, { $set: { read: true } });
  res.json({ success: true });
});
