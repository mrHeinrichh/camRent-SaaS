import { Router } from 'express';
import { STANDARD_RENTAL_FORM_VERSION, sanitizeRentalFormFields } from '../forms/rentalForm';
import { authenticate, checkRole } from '../middleware/auth';
import { Item } from '../models/Item';
import { FraudList } from '../models/FraudList';
import { Order } from '../models/Order';
import { OrderDocument } from '../models/OrderDocument';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';

export const ownerRoutes = Router();

ownerRoutes.get('/owner/fraud-list', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
  if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
  if (store.status !== 'approved') {
    return res.status(403).json({ error: 'Pending stores cannot access. Your account must be approved before you can see this.' });
  }
  const list = await FraudList.find({
    $or: [{ store_id: store._id }, { scope: 'global', status: 'approved' }, { scope: 'global', status: 'pending', reported_by: toId(req.user!.id) }],
  })
    .sort({ created_at: -1 })
    .lean();
  res.json(serializeMany(list as any[]));
});

ownerRoutes.post('/owner/customers/report-fraud', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
  if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
  if (store.status !== 'approved') {
    return res.status(403).json({ error: 'Pending stores cannot access. Your account must be approved before you can see this.' });
  }

  const { full_name, email, contact_number, reason, scope, evidence_image_url } = req.body || {};
  if (!full_name || !email) return res.status(400).json({ error: 'Full name and email are required' });
  const normalizedScope = scope === 'global' ? 'global' : 'internal';
  if (normalizedScope === 'internal' && !String(reason || '').trim()) {
    return res.status(400).json({ error: 'Reason is required for internal fraud flagging' });
  }
  if (normalizedScope === 'global' && !String(reason || '').trim() && !String(evidence_image_url || '').trim()) {
    return res.status(400).json({ error: 'Global request must include reason or evidence image' });
  }

  const entry = await FraudList.create({
    store_id: normalizedScope === 'internal' ? store._id : store._id,
    scope: normalizedScope,
    status: normalizedScope === 'global' ? 'pending' : 'approved',
    full_name: String(full_name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    contact_number: String(contact_number || '').trim(),
    billing_address: '',
    reason: String(reason || '').trim(),
    evidence_image_url: String(evidence_image_url || '').trim(),
    global_request_reason: normalizedScope === 'global' ? String(reason || '').trim() : '',
    reported_by: toId(req.user!.id),
  });

  res.json({ success: true, fraud: serialize(entry as any) });
});

ownerRoutes.get('/owner/rental-form', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
  if (!store) return res.status(404).json({ error: 'No store found for this owner account' });

  const schema = (store as any).rental_form_schema || {};
  const settings = (store as any).rental_form_settings || {};
  res.json({
    standard_version: STANDARD_RENTAL_FORM_VERSION,
    fields: sanitizeRentalFormFields(schema.fields),
    settings: {
      show_branch_map: settings.show_branch_map !== false,
      reference_text: String(settings.reference_text || ''),
      reference_image_url: String(settings.reference_image_url || ''),
      reference_image_position: settings.reference_image_position === 'mid' ? 'mid' : 'top',
    },
  });
});

ownerRoutes.put('/owner/rental-form', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const store = await Store.findOne({ owner_id: toId(req.user!.id) });
  if (!store) return res.status(404).json({ error: 'No store found for this owner account' });

  const fields = sanitizeRentalFormFields(req.body?.fields);
  const settingsPayload = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {};
  (store as any).rental_form_schema = {
    version: STANDARD_RENTAL_FORM_VERSION,
    fields,
  };
  (store as any).rental_form_settings = {
    show_branch_map: settingsPayload.show_branch_map !== false,
    reference_text: String(settingsPayload.reference_text || '').trim(),
    reference_image_url: String(settingsPayload.reference_image_url || '').trim(),
    reference_image_position: settingsPayload.reference_image_position === 'mid' ? 'mid' : 'top',
  };
  await store.save();

  res.json({
    success: true,
    standard_version: STANDARD_RENTAL_FORM_VERSION,
    fields,
    settings: (store as any).rental_form_settings,
  });
});

ownerRoutes.get('/dashboard/owner', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const storeDoc = await Store.findOne({ owner_id: toId(req.user!.id) });
  if (!storeDoc) {
    console.warn('[owner] dashboard requested without store', {
      ownerId: req.user!.id,
      email: req.user!.email,
    });
    return res.status(404).json({ error: 'No store found for this owner account' });
  }
  if (storeDoc.status === 'approved' && !storeDoc.approved_at) {
    const derivedApprovedAt =
      storeDoc.payment_due_date instanceof Date
        ? new Date(new Date(storeDoc.payment_due_date).setMonth(new Date(storeDoc.payment_due_date).getMonth() - 1))
        : new Date();
    storeDoc.approved_at = derivedApprovedAt;
    if (!storeDoc.payment_due_date) {
      const dueDate = new Date(derivedApprovedAt);
      dueDate.setMonth(dueDate.getMonth() + 1);
      storeDoc.payment_due_date = dueDate;
    }
    await storeDoc.save();
  }
  const store = storeDoc.toObject();

  const orders = await Order.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
  const items = await Item.find({ store_id: store._id }).lean();
  const recentOrders = orders.slice(0, 10);
  const allOrderIds = orders.map((order) => order._id);
  const allDocs = await OrderDocument.find({ order_id: { $in: allOrderIds } }).lean();
  const docsByOrder = new Map<string, string[]>();
  for (const doc of allDocs) {
    const key = doc.order_id.toString();
    docsByOrder.set(key, [...(docsByOrder.get(key) || []), doc.document_type]);
  }

  const allOrderItems = await OrderItem.find({ order_id: { $in: allOrderIds } }).lean();
  const orderItemsByOrder = new Map<string, typeof allOrderItems>();
  for (const orderItem of allOrderItems) {
    const key = orderItem.order_id.toString();
    const existing = orderItemsByOrder.get(key) || [];
    existing.push(orderItem);
    orderItemsByOrder.set(key, existing);
  }
  const itemIds = allOrderItems.map((orderItem) => orderItem.item_id);
  const rentedItems = await Item.find({ _id: { $in: itemIds } }).lean();
  const rentedItemById = new Map(rentedItems.map((item) => [item._id.toString(), item]));

  const customerMap = new Map<
    string,
    { renter_name: string; renter_email: string; renter_phone: string; renter_address: string; transaction_count: number; id_types: string[]; gearCount: Map<string, number> }
  >();
  for (const order of orders) {
    const key = order.renter_email || `order-${order._id.toString()}`;
    const existing = customerMap.get(key) || {
      renter_name: order.renter_name,
      renter_email: order.renter_email,
      renter_phone: order.renter_phone,
      renter_address: order.renter_address,
      transaction_count: 0,
      id_types: [],
      gearCount: new Map<string, number>(),
    };
    existing.transaction_count += 1;
    const orderDocTypes = docsByOrder.get(order._id.toString()) || [];
    existing.id_types = [...new Set([...existing.id_types, ...orderDocTypes])];
    const orderItems = orderItemsByOrder.get(order._id.toString()) || [];
    for (const orderItem of orderItems) {
      const name = rentedItemById.get(orderItem.item_id.toString())?.name || 'Unknown Gear';
      existing.gearCount.set(name, (existing.gearCount.get(name) || 0) + 1);
    }
    customerMap.set(key, existing);
  }

  const stats = {
    total_rentals: orders.length,
    total_revenue: orders.reduce((sum, order) => (['APPROVED', 'COMPLETED'].includes(order.status) ? sum + order.total_amount : sum), 0),
  };
  const successfulStatuses = new Set(['APPROVED', 'ONGOING', 'COMPLETED']);
  const activeRentStatuses = new Set(['APPROVED', 'ONGOING']);
  const excludedPeakStatuses = new Set(['REJECTED', 'CANCELLED', 'CANCELLED_BY_OWNER', 'FRAUD_REPORTED']);
  const uniqueCustomerEmails = new Set(orders.map((order) => order.renter_email).filter(Boolean));
  const totalSuccessfulRentals = orders.filter((order) => successfulStatuses.has(order.status)).length;
  const totalProfit = orders.reduce((sum, order) => (successfulStatuses.has(order.status) ? sum + order.total_amount : sum), 0);
  const pendingCount = orders.filter((order) => order.status === 'PENDING_REVIEW').length;
  const reservedCount = orders.filter((order) => activeRentStatuses.has(order.status)).length;

  const peakDateCounter = new Map<string, number>();
  for (const order of orders) {
    if (excludedPeakStatuses.has(order.status)) continue;
    const linkedItems = orderItemsByOrder.get(order._id.toString()) || [];
    for (const linkedItem of linkedItems) {
      const start = new Date(linkedItem.start_date);
      const end = new Date(linkedItem.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10);
        peakDateCounter.set(key, (peakDateCounter.get(key) || 0) + 1);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }
  const peakRentalDates = [...peakDateCounter.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    store: serialize(store as any),
    stats,
    recentOrders: serializeMany(recentOrders as any[]),
    recentTransactions: recentOrders.map((order) => ({
      ...(serialize(order as any) as Record<string, unknown>),
      id_types: docsByOrder.get(order._id.toString()) || [],
    })),
    customers: [...customerMap.values()].map((customer) => ({
      renter_name: customer.renter_name,
      renter_email: customer.renter_email,
      renter_phone: customer.renter_phone,
      renter_address: customer.renter_address,
      transaction_count: customer.transaction_count,
      id_types: customer.id_types,
      mostly_rented_gears: [...customer.gearCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count })),
    })),
    ownerAnalytics: {
      totalCustomers: uniqueCustomerEmails.size,
      totalCustomersRented: totalSuccessfulRentals,
      totalProfit,
      pendingCount,
      reservedCount,
      peakRentalDates,
    },
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
        quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
      })),
    });
  }

  res.json(payload);
});
