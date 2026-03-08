import { Router } from 'express';
import { Types } from 'mongoose';
import { authenticate, checkRole } from '../middleware/auth';
import { Item } from '../models/Item';
import { ManualBlock } from '../models/ManualBlock';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';

export const itemRoutes = Router();

itemRoutes.get('/', authenticate, async (req: AuthedRequest, res) => {
  if (req.user?.role === 'owner') {
    const ownedStores = await Store.find({ owner_id: toId(req.user.id) }).select('_id').lean();
    const storeIds = ownedStores.map((store) => store._id);
    const items = await Item.find({ store_id: { $in: storeIds } }).lean();
    return res.json(serializeMany(items as any[]));
  }

  const activeStores = await Store.find({ status: 'approved', is_active: true }).select('_id').lean();
  const items = await Item.find({ store_id: { $in: activeStores.map((store) => store._id) } }).lean();
  res.json(serializeMany(items as any[]));
});

itemRoutes.get('/:id', async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Item not found' });
  const item = await Item.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const store = await Store.findById(item.store_id).lean();
  if (!store || store.status !== 'approved' || !store.is_active) return res.status(404).json({ error: 'Item not found' });

  const orderItems = await OrderItem.find({ item_id: item._id }).lean();
  const bookings = [];
  for (const orderItem of orderItems) {
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order || !['APPROVED', 'PENDING_REVIEW', 'ONGOING'].includes(order.status)) continue;
    bookings.push({
      start_date: orderItem.start_date,
      end_date: orderItem.end_date,
      status: order.status,
    });
  }

  const manualBlocks = await ManualBlock.find({ item_id: item._id }).lean();
  res.json({
    ...serialize(item as any),
    bookings,
    manualBlocks: serializeMany(manualBlocks as any[]),
  });
});

itemRoutes.post('/', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const { store_id, name, description, daily_price, deposit_amount, image_url, category } = req.body;
  const store = await Store.findById(store_id).lean();
  if (!store || store.owner_id.toString() !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  const item = await Item.create({
    store_id: toId(store_id),
    name,
    description,
    daily_price,
    deposit_amount,
    image_url,
    category,
  });

  res.json({ id: item._id.toString() });
});
