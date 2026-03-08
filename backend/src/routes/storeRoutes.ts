import { Router } from 'express';
import { Types } from 'mongoose';
import { DEFAULT_STORE_BANNER_URL, DEFAULT_STORE_LOGO_URL } from '../config/defaults';
import { authenticate, checkRole } from '../middleware/auth';
import { Item } from '../models/Item';
import { Store } from '../models/Store';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';

export const storeRoutes = Router();

storeRoutes.get('/', async (_req, res) => {
  const stores = await Store.find({ status: 'approved', is_active: true }).lean();
  res.json(serializeMany(stores as any[]));
});

storeRoutes.get('/:id', async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Store not found' });
  const store = await Store.findById(req.params.id).lean();
  if (!store || store.status !== 'approved' || !store.is_active) return res.status(404).json({ error: 'Store not found' });
  const items = await Item.find({ store_id: store._id }).lean();
  res.json({ ...serialize(store as any), items: serializeMany(items as any[]) });
});

storeRoutes.post('/', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const { name, description, address, logo_url, banner_url } = req.body;
  const store = await Store.create({
    owner_id: toId(req.user!.id),
    name,
    description,
    address,
    logo_url: logo_url || DEFAULT_STORE_LOGO_URL,
    banner_url: banner_url || DEFAULT_STORE_BANNER_URL,
  });
  res.json({ id: store._id.toString() });
});
