import { Router } from 'express';
import { authenticate, checkRole } from '../middleware/auth';
import { FraudList } from '../models/FraudList';
import { Item } from '../models/Item';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { enforceStoreDueDeactivation } from '../services/billingService';
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
  const fraud = await FraudList.findById(req.params.id);
  if (!fraud) return res.status(404).json({ error: 'Fraud entry not found' });
  fraud.store_id = null;
  fraud.scope = 'global';
  fraud.status = 'approved';
  fraud.approved_by_admin = (req as any).user?.id || null;
  await fraud.save();
  res.json({ success: true });
});

adminRoutes.post('/admin/fraud-list/:id/approve-global', authenticate, checkRole(['admin']), async (req: any, res) => {
  const fraud = await FraudList.findById(req.params.id);
  if (!fraud) return res.status(404).json({ error: 'Fraud entry not found' });
  if (fraud.scope !== 'global' || fraud.status !== 'pending') {
    return res.status(400).json({ error: 'This entry is not a pending global request' });
  }
  fraud.store_id = null;
  fraud.status = 'approved';
  fraud.approved_by_admin = req.user?.id || null;
  await fraud.save();
  res.json({ success: true });
});

adminRoutes.post('/admin/fraud-list', authenticate, checkRole(['admin']), async (req: any, res) => {
  const { full_name, email, contact_number, reason, evidence_image_url } = req.body || {};
  if (!full_name || !email || !reason) {
    return res.status(400).json({ error: 'Full name, email, and reason are required' });
  }
  const entry = await FraudList.create({
    store_id: null,
    scope: 'global',
    status: 'approved',
    full_name: String(full_name).trim(),
    email: String(email).trim().toLowerCase(),
    contact_number: String(contact_number || '').trim(),
    billing_address: '',
    reason: String(reason).trim(),
    evidence_image_url: String(evidence_image_url || '').trim(),
    reported_by: req.user?.id,
    approved_by_admin: req.user?.id,
  });
  res.json({ success: true, fraud: serialize(entry as any) });
});

adminRoutes.delete('/admin/fraud-list/:id', authenticate, checkRole(['admin']), async (req, res) => {
  await FraudList.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

adminRoutes.put('/admin/fraud-list/:id', authenticate, checkRole(['admin']), async (req, res) => {
  const fraud = await FraudList.findById(req.params.id);
  if (!fraud) return res.status(404).json({ error: 'Fraud entry not found' });
  const fullName = req.body?.full_name;
  const email = req.body?.email;
  const contactNumber = req.body?.contact_number;
  const reason = req.body?.reason;
  const evidenceImageUrl = req.body?.evidence_image_url;
  const scope = req.body?.scope;
  const status = req.body?.status;

  if (fullName !== undefined) fraud.full_name = String(fullName || '').trim();
  if (email !== undefined) fraud.email = String(email || '').trim().toLowerCase();
  if (contactNumber !== undefined) fraud.contact_number = String(contactNumber || '').trim();
  if (reason !== undefined) fraud.reason = String(reason || '').trim();
  if (evidenceImageUrl !== undefined) fraud.evidence_image_url = String(evidenceImageUrl || '').trim();
  if (scope !== undefined) {
    if (scope !== 'internal' && scope !== 'global') return res.status(400).json({ error: 'Invalid scope value' });
    fraud.scope = scope;
  }
  if (status !== undefined) {
    if (status !== 'approved' && status !== 'pending') return res.status(400).json({ error: 'Invalid status value' });
    fraud.status = status;
  }

  if (!fraud.full_name || !fraud.email || !fraud.reason) {
    return res.status(400).json({ error: 'Full name, email, and reason are required' });
  }
  if (fraud.scope === 'global') {
    fraud.global_request_reason = fraud.reason;
    if (fraud.status === 'approved') {
      fraud.approved_by_admin = (req as any).user?.id || null;
      fraud.store_id = null;
    }
  } else {
    fraud.global_request_reason = '';
  }
  await fraud.save();
  res.json({ success: true, fraud: serialize(fraud as any) });
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
  await enforceStoreDueDeactivation();
  const [pendingStores, allStores, orders, items, customers] = await Promise.all([
    Store.find({ status: 'pending' }).lean(),
    Store.find().lean(),
    Order.find().lean(),
    Item.find().lean(),
    User.find({ role: 'renter' }).lean(),
  ]);

  const successfulStatuses = new Set(['APPROVED', 'ONGOING', 'COMPLETED']);
  const storeInsights = allStores.map((store) => {
    const storeOrders = orders.filter((order) => order.store_id.toString() === store._id.toString());
    const income = storeOrders.reduce((sum, order) => (successfulStatuses.has(order.status) ? sum + order.total_amount : sum), 0);
    const storeItems = items.filter((item) => item.store_id.toString() === store._id.toString());
    const assetsValue = storeItems.reduce((sum, item) => sum + item.daily_price * Math.max(0, Number(item.stock) || 0), 0);
    const assetsCount = storeItems.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0);
    const uniqueCustomers = new Set(storeOrders.map((order) => order.renter_email).filter(Boolean)).size;
    return {
      store_id: store._id.toString(),
      store_name: store.name,
      income,
      assets_value: assetsValue,
      assets_count: assetsCount,
      customers_count: uniqueCustomers,
      pending_count: storeOrders.filter((order) => order.status === 'PENDING_REVIEW').length,
      approved_count: storeOrders.filter((order) => order.status === 'APPROVED').length,
    };
  });

  const systemSummary = {
    totalIncome: storeInsights.reduce((sum, entry) => sum + entry.income, 0),
    totalAssetsValue: storeInsights.reduce((sum, entry) => sum + entry.assets_value, 0),
    totalCustomers: customers.length,
    disabledCustomers: customers.filter((customer) => customer.is_active === false).length,
  };

  res.json({
    pendingStores: serializeMany(pendingStores as any[]),
    allStores: serializeMany(allStores as any[]),
    storeInsights,
    customers: serializeMany(customers as any[]),
    systemSummary,
  });
});

adminRoutes.post('/admin/stores/:id/approve', authenticate, checkRole(['admin']), async (req, res) => {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setMonth(dueDate.getMonth() + 1);
  await Store.findByIdAndUpdate(req.params.id, {
    status: 'approved',
    is_active: true,
    approved_at: now,
    payment_due_date: dueDate,
  });
  res.json({ success: true });
});

adminRoutes.post('/admin/stores/:id/active', authenticate, checkRole(['admin']), async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }

  await Store.findByIdAndUpdate(req.params.id, { is_active: isActive });
  res.json({ success: true });
});

adminRoutes.post('/admin/customers/:id/active', authenticate, checkRole(['admin']), async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'renter') return res.status(404).json({ error: 'Customer not found' });
  user.is_active = isActive;
  await user.save();
  res.json({ success: true });
});
