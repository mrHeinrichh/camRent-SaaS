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
  const items = await Item.find({ store_id: { $in: activeStores.map((store) => store._id) }, is_available: true, stock: { $gt: 0 } }).lean();
  res.json(serializeMany(items as any[]));
});

itemRoutes.get('/:id', authenticate, async (req: AuthedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Item not found' });
  const item = await Item.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const store = await Store.findById(item.store_id).lean();
  if (!store) return res.status(404).json({ error: 'Item not found' });

  const isOwnerOfStore = Boolean(req.user?.role === 'owner' && store.owner_id.toString() === req.user.id);

  if (!isOwnerOfStore && (store.status !== 'approved' || !store.is_active || item.is_available === false || Number(item.stock) <= 0)) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const orderItems = await OrderItem.find({ item_id: item._id }).lean();
  const bookings = [];
  for (const orderItem of orderItems) {
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order || !['APPROVED', 'ONGOING', 'PENDING_REVIEW'].includes(order.status)) continue;
    bookings.push({
      start_date: orderItem.start_date,
      end_date: orderItem.end_date,
      status: order.status,
      renter_name: order.renter_name,
    });
  }

  const manualBlocks = await ManualBlock.find({ item_id: item._id }).lean();
  res.json({
    ...serialize(item as any),
    bookings,
    manualBlocks: serializeMany(manualBlocks as any[]),
  });
});

itemRoutes.put('/:id', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Item not found' });
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const store = await Store.findById(item.store_id).lean();
  if (!store || store.owner_id.toString() !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, description, daily_price, deposit_amount, image_url, category, is_available, stock } = req.body;
  item.name = name ?? item.name;
  item.description = description ?? item.description;
  item.daily_price = daily_price ?? item.daily_price;
  item.deposit_amount = Number.isFinite(Number(deposit_amount)) ? Number(deposit_amount) : item.deposit_amount;
  item.image_url = image_url ?? item.image_url;
  item.category = category ?? item.category;
  if (typeof is_available === 'boolean') item.is_available = is_available;
  if (Number.isFinite(Number(stock))) item.stock = Math.max(0, Math.floor(Number(stock)));
  await item.save();

  res.json({ success: true, item: serialize(item as any) });
});

itemRoutes.delete('/:id', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Item not found' });
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const store = await Store.findById(item.store_id).lean();
  if (!store || store.owner_id.toString() !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  const orderItems = await OrderItem.find({ item_id: item._id }).lean();
  for (const orderItem of orderItems) {
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order) continue;
    if (['APPROVED', 'ONGOING', 'PENDING_REVIEW'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot delete item with active or pending applications' });
    }
  }

  await ManualBlock.deleteMany({ item_id: item._id });
  await OrderItem.deleteMany({ item_id: item._id });
  await item.deleteOne();

  res.json({ success: true });
});

itemRoutes.post('/', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const { store_id, name, description, daily_price, deposit_amount, image_url, category, is_available, stock } = req.body;
  const store = await Store.findById(store_id).lean();
  if (!store || store.owner_id.toString() !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  const item = await Item.create({
    store_id: toId(store_id),
    name,
    description,
    daily_price,
    deposit_amount: Number.isFinite(Number(deposit_amount)) ? Number(deposit_amount) : 0,
    image_url,
    category,
    is_available: typeof is_available === 'boolean' ? is_available : true,
    stock: Number.isFinite(Number(stock)) ? Math.max(0, Math.floor(Number(stock))) : 1,
  });

  res.json({ id: item._id.toString() });
});
