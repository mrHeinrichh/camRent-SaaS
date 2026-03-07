import { Router } from 'express';
import { authenticate, checkRole } from '../middleware/auth';
import { Item } from '../models/Item';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';

export const ownerRoutes = Router();

ownerRoutes.get('/dashboard/owner', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
  if (!store) {
    console.warn('[owner] dashboard requested without store', {
      ownerId: req.user!.id,
      email: req.user!.email,
    });
    return res.status(404).json({ error: 'No store found for this owner account' });
  }

  const orders = await Order.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
  const items = await Item.find({ store_id: store._id }).lean();

  const stats = {
    total_rentals: orders.length,
    total_revenue: orders.reduce((sum, order) => (['APPROVED', 'COMPLETED'].includes(order.status) ? sum + order.total_amount : sum), 0),
  };

  res.json({
    store: serialize(store as any),
    stats,
    recentOrders: serializeMany(orders.slice(0, 10) as any[]),
    items: serializeMany(items as any[]),
  });
});

ownerRoutes.get('/owner/applications', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
  if (!store) {
    console.warn('[owner] applications requested without store', {
      ownerId: req.user!.id,
      email: req.user!.email,
    });
    return res.status(404).json({ error: 'No store found for this owner account' });
  }

  const orders = await Order.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
  const payload = [];

  for (const order of orders) {
    const orderItems = await OrderItem.find({ order_id: order._id }).lean();
    const itemIds = orderItems.map((item) => item.item_id);
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    const itemsById = new Map(items.map((item) => [item._id.toString(), item]));

    payload.push({
      ...(serialize(order as any) as Record<string, unknown>),
      items: orderItems.map((orderItem) => ({
        id: orderItem.item_id.toString(),
        name: itemsById.get(orderItem.item_id.toString())?.name || '',
        start_date: orderItem.start_date,
        end_date: orderItem.end_date,
      })),
    });
  }

  res.json(payload);
});
