import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Announcement } from '../models/Announcement';
import { AnnouncementSettings } from '../models/AnnouncementSettings';
import { SiteContent } from '../models/SiteContent';
import { authenticate, checkRole } from '../middleware/auth';
import { DonationSettings } from '../models/DonationSettings';
import { FraudList } from '../models/FraudList';
import { Item } from '../models/Item';
import { Order } from '../models/Order';
import { OrderDocument } from '../models/OrderDocument';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import { StoreReview } from '../models/StoreReview';
import { SupportTicket } from '../models/SupportTicket';
import { User } from '../models/User';
import { enforceStoreDueDeactivation } from '../services/billingService';
import { serialize, serializeMany } from '../utils/mongo';

export const adminRoutes = Router();

const adminTicketStatusValues = new Set(['open', 'in_progress', 'resolved', 'closed']);
const adminTicketPriorityValues = new Set(['low', 'medium', 'high']);
const normalize = (value: unknown) => String(value || '').trim();
const normalizeEmail = (value: unknown) => normalize(value).toLowerCase();
const sanitizeRequirementFiles = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ type: string; url: string }>;
  return value
    .map((entry: any) => ({
      type: normalize(entry?.type),
      url: normalize(entry?.url),
    }))
    .filter((entry) => entry.url)
    .slice(0, 5);
};
const sanitizeDonationQrCodes = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ label: string; url: string }>;
  return value
    .map((entry: any) => ({
      label: normalize(entry?.label),
      url: normalize(entry?.url),
    }))
    .filter((entry) => entry.url);
};

const sanitizeDonationBankDetails = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ label: string; url: string }>;
  return value
    .map((entry: any) => ({
      label: normalize(entry?.label),
      url: normalize(entry?.url),
    }))
    .filter((entry) => entry.label || entry.url);
};

const sanitizeSiteLinks = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ label: string; page: string; url: string; requires_login: boolean }>;
  return value
    .map((entry: any) => ({
      label: normalize(entry?.label),
      page: normalize(entry?.page),
      url: normalize(entry?.url),
      requires_login: Boolean(entry?.requires_login),
    }))
    .filter((entry) => entry.label && (entry.page || entry.url));
};

const sanitizeSiteSocialLinks = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ label: string; url: string }>;
  return value
    .map((entry: any) => ({
      label: normalize(entry?.label),
      url: normalize(entry?.url),
    }))
    .filter((entry) => entry.label && entry.url);
};

const sanitizeSiteSections = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ title: string; body: string }>;
  return value
    .map((entry: any) => ({
      title: normalize(entry?.title),
      body: normalize(entry?.body),
    }))
    .filter((entry) => entry.title || entry.body);
};

const sanitizeSiteFaqItems = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<{ q: string; a: string }>;
  return value
    .map((entry: any) => ({
      q: normalize(entry?.q),
      a: normalize(entry?.a),
    }))
    .filter((entry) => entry.q || entry.a);
};

const sanitizeSiteGuideItems = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((entry: any) => normalize(entry)).filter(Boolean);
};

const verifyAdminPassword = async (adminUserId: string, adminPassword: string) => {
  const adminUser = await User.findById(adminUserId);
  if (!adminUser || adminUser.role !== 'admin') return false;
  return bcrypt.compare(String(adminPassword || ''), adminUser.password);
};

const deleteStoreData = async (storeId: string) => {
  const orders = await Order.find({ store_id: storeId }).select('_id').lean();
  const orderIds = orders.map((order: any) => order._id);
  if (orderIds.length) {
    await Promise.all([OrderItem.deleteMany({ order_id: { $in: orderIds } }), OrderDocument.deleteMany({ order_id: { $in: orderIds } })]);
  }
  await Promise.all([
    Order.deleteMany({ store_id: storeId }),
    Item.deleteMany({ store_id: storeId }),
    FraudList.deleteMany({ store_id: storeId }),
    SupportTicket.deleteMany({ store_id: storeId }),
    StoreReview.deleteMany({ store_id: storeId }),
    Store.deleteOne({ _id: storeId }),
  ]);
};

adminRoutes.get('/donation-settings', async (_req, res) => {
  const settings = await DonationSettings.findOne({}).lean();
  res.json(
    settings
      ? serialize(settings as any)
      : {
          id: null,
          message: 'Support this website by donating funds for its maintenance. Any amount will be appreciated.',
          qr_codes: [],
          bank_details: [],
          is_active: true,
        },
  );
});

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
  const { full_name, email, contact_number, requirement_files, reason, evidence_image_url } = req.body || {};
  if (!full_name || !email || !reason) {
    return res.status(400).json({ error: 'Full name, email, and reason are required' });
  }
  if (Array.isArray(requirement_files) && requirement_files.length > 5) {
    return res.status(400).json({ error: 'You can upload up to 5 requirement files only' });
  }
  const entry = await FraudList.create({
    store_id: null,
    scope: 'global',
    status: 'approved',
    full_name: normalize(full_name),
    email: normalizeEmail(email),
    contact_number: normalize(contact_number),
    billing_address: '',
    id_number: '',
    id_numbers: [],
    requirement_files: sanitizeRequirementFiles(requirement_files),
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
  const requirementFiles = req.body?.requirement_files;
  const scope = req.body?.scope;
  const status = req.body?.status;

  if (fullName !== undefined) fraud.full_name = String(fullName || '').trim();
  if (email !== undefined) fraud.email = String(email || '').trim().toLowerCase();
  if (contactNumber !== undefined) fraud.contact_number = String(contactNumber || '').trim();
  if (reason !== undefined) fraud.reason = String(reason || '').trim();
  if (evidenceImageUrl !== undefined) fraud.evidence_image_url = String(evidenceImageUrl || '').trim();
  if (requirementFiles !== undefined) {
    if (Array.isArray(requirementFiles) && requirementFiles.length > 5) {
      return res.status(400).json({ error: 'You can upload up to 5 requirement files only' });
    }
    (fraud as any).requirement_files = sanitizeRequirementFiles(requirementFiles);
  }
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
  const [pendingStores, allStores, orders, items, customers, orderItems, supportTickets, reviews, pendingGlobalFraudCount] = await Promise.all([
    Store.find({ status: 'pending' }).lean(),
    Store.find().lean(),
    Order.find().lean(),
    Item.find().lean(),
    User.find({ role: 'renter' }).lean(),
    OrderItem.find().lean(),
    SupportTicket.find().lean(),
    StoreReview.find().sort({ created_at: -1 }).lean(),
    FraudList.countDocuments({ scope: 'global', status: 'pending' }),
  ]);

  const successfulStatuses = new Set(['APPROVED', 'ONGOING', 'COMPLETED']);
  const ownerIds = allStores.map((store) => store.owner_id).filter(Boolean);
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownerById = new Map(owners.map((owner) => [owner._id.toString(), owner]));
  const itemById = new Map(items.map((item) => [item._id.toString(), item]));
  const storeById = new Map(allStores.map((store) => [store._id.toString(), store]));
  const orderById = new Map(orders.map((order) => [order._id.toString(), order]));
  const reviewByStore = new Map<string, { total: number; sum: number }>();
  for (const review of reviews) {
    const key = review.store_id.toString();
    const current = reviewByStore.get(key) || { total: 0, sum: 0 };
    current.total += 1;
    current.sum += Number((review as any).rating || 0);
    reviewByStore.set(key, current);
  }

  const orderCountByStore = new Map<string, number>();
  const lastOrderByStore = new Map<string, Date>();
  const orderCountByCustomerEmail = new Map<string, number>();
  const successfulOrderCountByCustomerEmail = new Map<string, number>();
  const spendByCustomerEmail = new Map<string, number>();
  const lastOrderByCustomerEmail = new Map<string, Date>();

  for (const order of orders) {
    const storeId = order.store_id.toString();
    orderCountByStore.set(storeId, (orderCountByStore.get(storeId) || 0) + 1);
    const orderDate = new Date(order.created_at as any);
    if (!Number.isNaN(orderDate.getTime())) {
      const existingStoreDate = lastOrderByStore.get(storeId);
      if (!existingStoreDate || orderDate > existingStoreDate) lastOrderByStore.set(storeId, orderDate);
    }

    const renterEmail = normalizeEmail(order.renter_email);
    if (renterEmail) {
      orderCountByCustomerEmail.set(renterEmail, (orderCountByCustomerEmail.get(renterEmail) || 0) + 1);
      if (successfulStatuses.has(order.status)) {
        successfulOrderCountByCustomerEmail.set(renterEmail, (successfulOrderCountByCustomerEmail.get(renterEmail) || 0) + 1);
        spendByCustomerEmail.set(renterEmail, (spendByCustomerEmail.get(renterEmail) || 0) + Number(order.total_amount || 0));
      }
      if (!Number.isNaN(orderDate.getTime())) {
        const existingCustomerDate = lastOrderByCustomerEmail.get(renterEmail);
        if (!existingCustomerDate || orderDate > existingCustomerDate) lastOrderByCustomerEmail.set(renterEmail, orderDate);
      }
    }
  }

  const now = new Date();
  let nearDueStores = 0;
  let overdueStores = 0;
  const storeInsights = allStores.map((store) => {
    const storeOrders = orders.filter((order) => order.store_id.toString() === store._id.toString());
    const income = storeOrders.reduce((sum, order) => (successfulStatuses.has(order.status) ? sum + order.total_amount : sum), 0);
    const storeItems = items.filter((item) => item.store_id.toString() === store._id.toString());
    const assetsValue = storeItems.reduce((sum, item) => sum + item.daily_price * Math.max(0, Number(item.stock) || 0), 0);
    const assetsCount = storeItems.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0);
    const uniqueCustomers = new Set(storeOrders.map((order) => order.renter_email).filter(Boolean)).size;
    const ratingInfo = reviewByStore.get(store._id.toString()) || { total: 0, sum: 0 };
    const avgRating = ratingInfo.total ? Number((ratingInfo.sum / ratingInfo.total).toFixed(2)) : 0;
    const dueDate = store.payment_due_date ? new Date(store.payment_due_date) : null;
    const dueDaysRemaining = dueDate && !Number.isNaN(dueDate.getTime()) ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isNearDue = typeof dueDaysRemaining === 'number' && dueDaysRemaining >= 0 && dueDaysRemaining <= 7;
    const isOverdue = typeof dueDaysRemaining === 'number' && dueDaysRemaining < 0;
    if (isNearDue) nearDueStores += 1;
    if (isOverdue) overdueStores += 1;
    const owner = ownerById.get(store.owner_id.toString());
    return {
      store_id: store._id.toString(),
      store_name: store.name,
      store_logo_url: String((store as any).logo_url || ''),
      owner_id: store.owner_id.toString(),
      owner_name: String(owner?.full_name || ''),
      owner_email: String(owner?.email || ''),
      owner_avatar_url: String(owner?.avatar_url || ''),
      income,
      assets_value: assetsValue,
      assets_count: assetsCount,
      customers_count: uniqueCustomers,
      pending_count: storeOrders.filter((order) => order.status === 'PENDING_REVIEW').length,
      approved_count: storeOrders.filter((order) => order.status === 'APPROVED').length,
      total_orders: orderCountByStore.get(store._id.toString()) || 0,
      total_items: storeItems.length,
      average_rating: avgRating,
      total_reviews: ratingInfo.total,
      due_days_remaining: dueDaysRemaining,
      near_due: isNearDue,
      overdue: isOverdue,
      last_order_at: lastOrderByStore.get(store._id.toString())?.toISOString() || null,
    };
  });

  const customerInsights = customers.map((customer) => {
    const email = normalizeEmail(customer.email);
    return {
      customer_id: customer._id.toString(),
      full_name: customer.full_name,
      email: customer.email,
      is_active: customer.is_active !== false,
      transaction_count: orderCountByCustomerEmail.get(email) || 0,
      successful_transactions: successfulOrderCountByCustomerEmail.get(email) || 0,
      total_spent: spendByCustomerEmail.get(email) || 0,
      last_transaction_at: lastOrderByCustomerEmail.get(email)?.toISOString() || null,
    };
  });

  const topCustomers = customerInsights
    .slice()
    .sort((a, b) => (b.total_spent === a.total_spent ? b.transaction_count - a.transaction_count : b.total_spent - a.total_spent))
    .slice(0, 10);

  const topGearCounter = new Map<string, { item_id: string; name: string; brand: string; category: string; store_id: string; store_name: string; rent_count: number; revenue_estimate: number }>();
  for (const orderItem of orderItems) {
    const order = orderById.get(orderItem.order_id.toString());
    if (!order || !successfulStatuses.has(order.status)) continue;
    const item = itemById.get(orderItem.item_id.toString());
    if (!item) continue;
    const key = item._id.toString();
    const store = storeById.get(item.store_id.toString());
    const quantity = Math.max(1, Number((orderItem as any).quantity) || 1);
    const start = new Date(orderItem.start_date as any);
    const end = new Date(orderItem.end_date as any);
    const daysRaw = Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? 1 : Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const revenueEstimate = Number(item.daily_price || 0) * quantity * daysRaw;
    const current =
      topGearCounter.get(key) || {
        item_id: key,
        name: item.name,
        brand: String((item as any).brand || ''),
        category: item.category,
        store_id: item.store_id.toString(),
        store_name: store?.name || '',
        rent_count: 0,
        revenue_estimate: 0,
      };
    current.rent_count += quantity;
    current.revenue_estimate += revenueEstimate;
    topGearCounter.set(key, current);
  }
  const topGears = [...topGearCounter.values()]
    .sort((a, b) => (b.rent_count === a.rent_count ? b.revenue_estimate - a.revenue_estimate : b.rent_count - a.rent_count))
    .slice(0, 15);

  const topStores = storeInsights
    .slice()
    .sort((a, b) => b.income - a.income)
    .slice(0, 10);

  const recentRatings = reviews.slice(0, 30).map((review: any) => ({
    id: review._id.toString(),
    store_id: review.store_id.toString(),
    store_name: storeById.get(review.store_id.toString())?.name || '',
    renter_name: String(review.renter_name || 'Customer'),
    rating: Number(review.rating || 0),
    description: String(review.description || ''),
    created_at: review.created_at ? new Date(review.created_at).toISOString() : '',
  }));

  const feedbackTickets = supportTickets.filter((ticket: any) => String(ticket.type || '').toLowerCase() === 'feedback');
  const openTickets = supportTickets.filter((ticket: any) => String(ticket.status || '').toLowerCase() === 'open').length;
  const inProgressTickets = supportTickets.filter((ticket: any) => String(ticket.status || '').toLowerCase() === 'in_progress').length;
  const resolvedTickets = supportTickets.filter((ticket: any) => {
    const status = String(ticket.status || '').toLowerCase();
    return status === 'resolved' || status === 'closed';
  }).length;

  const systemSummary = {
    totalIncome: storeInsights.reduce((sum, entry) => sum + entry.income, 0),
    totalAssetsValue: storeInsights.reduce((sum, entry) => sum + entry.assets_value, 0),
    totalCustomers: customers.length,
    disabledCustomers: customers.filter((customer) => customer.is_active === false).length,
    totalStores: allStores.length,
    pendingMerchants: pendingStores.length,
    nearDueStores,
    overdueStores,
    pendingGlobalFraud: pendingGlobalFraudCount,
    totalFeedback: feedbackTickets.length,
    totalRatings: reviews.length,
    openSupportTickets: openTickets,
    inProgressSupportTickets: inProgressTickets,
    resolvedSupportTickets: resolvedTickets,
  };

  res.json({
    pendingStores: serializeMany(pendingStores as any[]),
    allStores: serializeMany(allStores as any[]),
    storeInsights,
    customers: serializeMany(customers as any[]),
    customerInsights,
    topCustomers,
    topGears,
    topStores,
    recentRatings,
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

adminRoutes.post('/admin/stores/:id/delete', authenticate, checkRole(['admin']), async (req: any, res) => {
  const adminPassword = String(req.body?.admin_password || '').trim();
  if (!adminPassword) return res.status(400).json({ error: 'Admin password is required' });
  const validPassword = await verifyAdminPassword(req.user?.id, adminPassword);
  if (!validPassword) return res.status(403).json({ error: 'Invalid admin password' });

  const store = await Store.findById(req.params.id);
  if (!store) return res.status(404).json({ error: 'Store not found' });
  await deleteStoreData(store._id.toString());
  res.json({ success: true });
});

adminRoutes.post('/admin/users/:id/delete', authenticate, checkRole(['admin']), async (req: any, res) => {
  const adminPassword = String(req.body?.admin_password || '').trim();
  if (!adminPassword) return res.status(400).json({ error: 'Admin password is required' });
  const validPassword = await verifyAdminPassword(req.user?.id, adminPassword);
  if (!validPassword) return res.status(403).json({ error: 'Invalid admin password' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Admin users cannot be deleted' });
  if (String(user._id) === String(req.user?.id)) return res.status(403).json({ error: 'You cannot delete your own account' });

  if (user.role === 'owner') {
    const ownedStores = await Store.find({ owner_id: user._id }).select('_id').lean();
    for (const ownedStore of ownedStores as any[]) {
      await deleteStoreData(ownedStore._id.toString());
    }
    await SupportTicket.deleteMany({ owner_id: user._id });
  } else if (user.role === 'renter') {
    const renterOrders = await Order.find({
      $or: [{ renter_id: user._id }, { renter_email: normalizeEmail(user.email) }],
    })
      .select('_id')
      .lean();
    const renterOrderIds = renterOrders.map((order: any) => order._id);
    if (renterOrderIds.length) {
      await Promise.all([
        OrderItem.deleteMany({ order_id: { $in: renterOrderIds } }),
        OrderDocument.deleteMany({ order_id: { $in: renterOrderIds } }),
      ]);
    }
    await Promise.all([
      Order.deleteMany({ _id: { $in: renterOrderIds } }),
      StoreReview.deleteMany({ renter_id: user._id }),
    ]);
  }

  await User.deleteOne({ _id: user._id });
  res.json({ success: true });
});

adminRoutes.get('/admin/support-tickets', authenticate, checkRole(['admin']), async (_req, res) => {
  const tickets = await SupportTicket.find().sort({ updated_at: -1 }).lean();
  const storeIds = tickets.map((ticket) => ticket.store_id).filter(Boolean);
  const ownerIds = tickets.map((ticket) => ticket.owner_id).filter(Boolean);
  const reporterIds = tickets.map((ticket: any) => ticket.reporter_id).filter(Boolean);
  const [stores, owners] = await Promise.all([
    Store.find({ _id: { $in: storeIds } }).lean(),
    User.find({ _id: { $in: ownerIds } }).lean(),
  ]);
  const reporters = reporterIds.length ? await User.find({ _id: { $in: reporterIds } }).lean() : [];
  const storesById = new Map(stores.map((store) => [store._id.toString(), store]));
  const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));
  const reportersById = new Map(reporters.map((reporter) => [reporter._id.toString(), reporter]));

  res.json(
    tickets.map((ticket) => ({
      ...serialize(ticket as any),
      store_name: storesById.get(ticket.store_id.toString())?.name || '',
      owner_email: ownersById.get(ticket.owner_id.toString())?.email || '',
      owner_name: ownersById.get(ticket.owner_id.toString())?.full_name || '',
      reporter_name: (ticket as any).reporter_name || reportersById.get(String((ticket as any).reporter_id || ''))?.full_name || '',
      reporter_email: (ticket as any).reporter_email || reportersById.get(String((ticket as any).reporter_id || ''))?.email || '',
      reporter_phone: (ticket as any).reporter_phone || reportersById.get(String((ticket as any).reporter_id || ''))?.phone || '',
    })),
  );
});

adminRoutes.put('/admin/support-tickets/:id', authenticate, checkRole(['admin']), async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

  if (req.body?.status !== undefined) {
    const status = String(req.body.status || '').trim().toLowerCase();
    if (!adminTicketStatusValues.has(status)) return res.status(400).json({ error: 'Invalid status value' });
    (ticket as any).status = status;
    (ticket as any).resolved_at = status === 'resolved' || status === 'closed' ? new Date() : null;
  }
  if (req.body?.priority !== undefined) {
    const priority = String(req.body.priority || '').trim().toLowerCase();
    if (!adminTicketPriorityValues.has(priority)) return res.status(400).json({ error: 'Invalid priority value' });
    (ticket as any).priority = priority;
  }
  if (req.body?.admin_reply !== undefined) {
    (ticket as any).admin_reply = String(req.body.admin_reply || '').trim();
  }
  await ticket.save();
  res.json({ success: true, ticket: serialize(ticket as any) });
});

adminRoutes.delete('/admin/support-tickets/:id', authenticate, checkRole(['admin']), async (req, res) => {
  await SupportTicket.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

adminRoutes.get('/announcements', async (_req, res) => {
  const settings = await AnnouncementSettings.findOne({}).lean();
  if (settings && settings.is_enabled === false) {
    return res.json([]);
  }
  const announcements = await Announcement.find({ is_active: true }).sort({ sort_order: 1, updated_at: -1 }).lean();
  res.json(serializeMany(announcements as any[]));
});

adminRoutes.get('/site-content', async (_req, res) => {
  const content = await SiteContent.findOne({}).lean();
  res.json(
    content
      ? serialize(content as any)
      : {
          id: null,
          home: { badge: '', title: '', subtitle: '' },
          policies: { sections: [], faq_items: [], rental_guide_items: [] },
          footer: { about_text: '', about_links: [], policy_links: [], useful_links: [], social_links: [] },
        },
  );
});

adminRoutes.get('/admin/site-content', authenticate, checkRole(['admin']), async (_req, res) => {
  const content = await SiteContent.findOne({}).lean();
  res.json(
    content
      ? serialize(content as any)
      : {
          id: null,
          home: { badge: '', title: '', subtitle: '' },
          policies: { sections: [], faq_items: [], rental_guide_items: [] },
          footer: { about_text: '', about_links: [], policy_links: [], useful_links: [], social_links: [] },
        },
  );
});

adminRoutes.put('/admin/site-content', authenticate, checkRole(['admin']), async (req, res) => {
  const home = {
    badge: normalize(req.body?.home?.badge),
    title: normalize(req.body?.home?.title),
    subtitle: normalize(req.body?.home?.subtitle),
  };
  const policies = {
    sections: sanitizeSiteSections(req.body?.policies?.sections),
    faq_items: sanitizeSiteFaqItems(req.body?.policies?.faq_items),
    rental_guide_items: sanitizeSiteGuideItems(req.body?.policies?.rental_guide_items),
  };
  const footer = {
    about_text: normalize(req.body?.footer?.about_text),
    about_links: sanitizeSiteLinks(req.body?.footer?.about_links),
    policy_links: sanitizeSiteLinks(req.body?.footer?.policy_links),
    useful_links: sanitizeSiteLinks(req.body?.footer?.useful_links),
    social_links: sanitizeSiteSocialLinks(req.body?.footer?.social_links),
  };

  const content =
    (await SiteContent.findOneAndUpdate(
      {},
      { home, policies, footer },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )) || (await SiteContent.findOne({}));

  res.json({ success: true, content: serialize(content as any) });
});

adminRoutes.get('/admin/announcement-settings', authenticate, checkRole(['admin']), async (_req, res) => {
  const settings = await AnnouncementSettings.findOne({}).lean();
  res.json(
    settings
      ? serialize(settings as any)
      : {
          id: null,
          is_enabled: true,
        },
  );
});

adminRoutes.put('/admin/announcement-settings', authenticate, checkRole(['admin']), async (req, res) => {
  const isEnabled = req.body?.is_enabled !== false;
  const settings =
    (await AnnouncementSettings.findOneAndUpdate({}, { is_enabled: isEnabled }, { new: true, upsert: true, setDefaultsOnInsert: true })) ||
    (await AnnouncementSettings.findOne({}));
  res.json({ success: true, settings: serialize(settings as any) });
});

adminRoutes.get('/admin/announcements', authenticate, checkRole(['admin']), async (_req, res) => {
  const announcements = await Announcement.find().sort({ sort_order: 1, updated_at: -1 }).lean();
  res.json(serializeMany(announcements as any[]));
});

adminRoutes.get('/admin/donation-settings', authenticate, checkRole(['admin']), async (_req, res) => {
  const settings = await DonationSettings.findOne({}).lean();
  res.json(
    settings
      ? serialize(settings as any)
      : {
          id: null,
          message: 'Support this website by donating funds for its maintenance. Any amount will be appreciated.',
          qr_codes: [],
          bank_details: [],
          is_active: true,
        },
  );
});

adminRoutes.put('/admin/donation-settings', authenticate, checkRole(['admin']), async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const qrCodes = sanitizeDonationQrCodes(req.body?.qr_codes);
  const bankDetails = sanitizeDonationBankDetails(req.body?.bank_details);
  const isActive = req.body?.is_active !== false;

  const settings =
    (await DonationSettings.findOneAndUpdate(
      {},
      {
        message,
        qr_codes: qrCodes,
        bank_details: bankDetails,
        is_active: isActive,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )) || (await DonationSettings.findOne({}));

  res.json({ success: true, settings: serialize(settings as any) });
});

adminRoutes.post('/admin/announcements', authenticate, checkRole(['admin']), async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const imageUrl = String(req.body?.image_url || '').trim();
  if (!title && !description && !imageUrl) {
    return res.status(400).json({ error: 'Provide at least text (title/description) or image' });
  }
  const announcement = await Announcement.create({
    title,
    description,
    image_url: imageUrl,
    cta_label: String(req.body?.cta_label || '').trim(),
    cta_url: String(req.body?.cta_url || '').trim(),
    is_active: req.body?.is_active !== false,
    sort_order: Number.isFinite(Number(req.body?.sort_order)) ? Number(req.body?.sort_order) : 0,
  });
  res.json({ success: true, announcement: serialize(announcement as any) });
});

adminRoutes.put('/admin/announcements/:id', authenticate, checkRole(['admin']), async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

  if (req.body?.title !== undefined) {
    (announcement as any).title = String(req.body.title || '').trim();
  }
  if (req.body?.description !== undefined) (announcement as any).description = String(req.body.description || '').trim();
  if (req.body?.image_url !== undefined) (announcement as any).image_url = String(req.body.image_url || '').trim();
  if (req.body?.cta_label !== undefined) (announcement as any).cta_label = String(req.body.cta_label || '').trim();
  if (req.body?.cta_url !== undefined) (announcement as any).cta_url = String(req.body.cta_url || '').trim();
  if (req.body?.is_active !== undefined) (announcement as any).is_active = Boolean(req.body.is_active);
  if (req.body?.sort_order !== undefined) {
    const sortOrder = Number(req.body.sort_order);
    if (!Number.isFinite(sortOrder)) return res.status(400).json({ error: 'sort_order must be a number' });
    (announcement as any).sort_order = sortOrder;
  }
  if (!(announcement as any).title && !(announcement as any).description && !(announcement as any).image_url) {
    return res.status(400).json({ error: 'Provide at least text (title/description) or image' });
  }
  await announcement.save();
  res.json({ success: true, announcement: serialize(announcement as any) });
});

adminRoutes.delete('/admin/announcements/:id', authenticate, checkRole(['admin']), async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
