import { Router } from 'express';
import { authenticate, checkRole } from '../middleware/auth';
import { FraudList } from '../models/FraudList';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { serialize, serializeMany } from '../utils/mongo';

export const adminRoutes = Router();

adminRoutes.get('/admin/fraud-list', authenticate, checkRole(['admin']), async (_req, res) => {
  const list = await FraudList.find().sort({ created_at: -1 }).lean();
  const storeIds = list.map((entry) => entry.store_id).filter(Boolean);
  const userIds = list.map((entry) => entry.reported_by);
  const stores = await Store.find({ _id: { $in: storeIds } }).lean();
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const storesById = new Map(stores.map((store) => [store._id.toString(), store]));
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  res.json(
    list.map((entry) => ({
      ...serialize(entry as any),
      store_name: entry.store_id ? storesById.get(entry.store_id.toString())?.name || '' : null,
      reported_by_email: usersById.get(entry.reported_by.toString())?.email || '',
    })),
  );
});

adminRoutes.post('/admin/fraud-list/globalize/:id', authenticate, checkRole(['admin']), async (req, res) => {
  await FraudList.findByIdAndUpdate(req.params.id, { store_id: null });
  res.json({ success: true });
});

adminRoutes.delete('/admin/fraud-list/:id', authenticate, checkRole(['admin']), async (req, res) => {
  await FraudList.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

adminRoutes.get('/admin/fraud-analytics', authenticate, checkRole(['admin']), async (_req, res) => {
  const fraudEntries = await FraudList.find().lean();
  const stores = await Store.find().lean();
  const orders = await Order.find().lean();

  const countByField = (field: 'email' | 'contact_number') => {
    const counts = new Map<string, number>();
    for (const entry of fraudEntries) {
      const value = entry[field];
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ [field]: value, count }));
  };

  const fraudRatePerStore = stores.map((store) => {
    const storeOrders = orders.filter((order) => order.store_id.toString() === store._id.toString());
    const fraudOrders = storeOrders.filter((order) => order.status === 'FRAUD_REPORTED').length;
    return { name: store.name, fraud_rate: storeOrders.length ? (fraudOrders * 100) / storeOrders.length : 0 };
  });

  res.json({
    mostReportedEmails: countByField('email').map((item) => ({ email: item.email, count: item.count })),
    mostReportedPhones: countByField('contact_number').map((item) => ({ contact_number: item.contact_number, count: item.count })),
    fraudRatePerStore,
  });
});

adminRoutes.get('/dashboard/admin', authenticate, checkRole(['admin']), async (_req, res) => {
  const [pendingStores, allStores] = await Promise.all([Store.find({ status: 'pending' }).lean(), Store.find().lean()]);
  res.json({ pendingStores: serializeMany(pendingStores as any[]), allStores: serializeMany(allStores as any[]) });
});

adminRoutes.post('/admin/stores/:id/approve', authenticate, checkRole(['admin']), async (req, res) => {
  await Store.findByIdAndUpdate(req.params.id, { status: 'approved' });
  res.json({ success: true });
});
