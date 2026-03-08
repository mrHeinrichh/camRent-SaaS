import { Router } from 'express';
import { STANDARD_RENTAL_FORM_VERSION, sanitizeRentalFormFields, validateRentalCustomAnswers } from '../forms/rentalForm';
import { authenticate, checkRole, requireAuth } from '../middleware/auth';
import { FraudList } from '../models/FraudList';
import { Item } from '../models/Item';
import { ManualBlock } from '../models/ManualBlock';
import { Order } from '../models/Order';
import { OrderDocument } from '../models/OrderDocument';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';
import { hasBookingConflict, hasBookingConflictForQuantity } from '../services/bookingService';

export const orderRoutes = Router();

orderRoutes.get('/orders/id-requirements', async (req, res) => {
  const storeId = String(req.query.store_id || '');
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!storeId || !email) return res.json({ hasPreviousTransaction: false, requireIds: true });
  if (!/^[0-9a-fA-F]{24}$/.test(storeId)) return res.json({ hasPreviousTransaction: false, requireIds: true });

  const prior = await Order.findOne({ store_id: toId(storeId), renter_email: email }).lean();
  const hasPreviousTransaction = Boolean(prior);
  res.json({
    hasPreviousTransaction,
    requireIds: true,
  });
});

orderRoutes.post('/orders', authenticate, async (req: AuthedRequest, res) => {
  const {
    store_id,
    renter_name,
    renter_email,
    renter_phone,
    renter_emergency_contact,
    renter_address,
    store_branch_id,
    delivery_mode,
    delivery_address,
    payment_mode,
    items,
    total_amount,
    lease_agreement_submission_url,
    custom_answers,
    document_urls,
  } = req.body;

  if (!renter_name || !renter_email || !renter_phone || !renter_emergency_contact || !renter_address || !store_branch_id || !delivery_mode || !delivery_address || !payment_mode) {
    return res.status(400).json({ error: 'Please complete all required standard fields' });
  }
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'At least one gear is required' });

  const store = await Store.findById(store_id).lean();
  if (!store) return res.status(404).json({ error: 'Store not found' });
  const storeBranches = Array.isArray((store as any).branches) ? (store as any).branches : [];
  const matchedBranch = storeBranches.find((branch: any) => String(branch._id) === String(store_branch_id));
  const fallbackMainBranch = !storeBranches.length && String(store_branch_id) === 'main'
    ? {
        _id: 'main',
        name: 'Main Branch',
        address: String((store as any).address || ''),
      }
    : null;
  const branchToUse = matchedBranch || fallbackMainBranch;
  if (!branchToUse) return res.status(400).json({ error: 'Please select a valid store branch' });
  if (store.lease_agreement_file_url && (!lease_agreement_submission_url || !String(lease_agreement_submission_url).trim())) {
    return res.status(400).json({ error: 'Completed lease agreement file is required' });
  }
  const rentalFormFields = sanitizeRentalFormFields((store as any).rental_form_schema?.fields);
  const customAnswerValidation = validateRentalCustomAnswers(rentalFormFields, custom_answers);
  if (!customAnswerValidation.valid) {
    return res.status(400).json({ error: customAnswerValidation.error });
  }

  const normalizedEmail = String(renter_email || req.user?.email || '').toLowerCase();
  const docs = document_urls && typeof document_urls === 'object' ? document_urls : {};
  const requiredDocKeys = ['id1_front', 'id1_back', 'id2_front', 'id2_back', 'selfie_id'];
  for (const key of requiredDocKeys) {
    if (!docs[key] || !String(docs[key]).trim()) {
      return res.status(400).json({ error: '2 valid IDs (both front and back) and a selfie with ID are required' });
    }
  }

  const fraudMatch = await FraudList.findOne({
    $or: [renter_name ? { full_name: renter_name } : null, renter_email ? { email: renter_email } : null, renter_phone ? { contact_number: renter_phone } : null, renter_address ? { billing_address: renter_address } : null].filter(Boolean),
  }).lean();

  try {
    for (const item of items) {
      const requestedQuantity = Math.max(1, Number(item.quantity) || 1);
      const conflict = await hasBookingConflictForQuantity(item.id, item.startDate, item.endDate, requestedQuantity);
      if (conflict) return res.status(400).json({ error: `Item ${item.id} is already booked or blocked for these dates` });
    }

    const order = await Order.create({
      store_id: toId(store_id),
      renter_id: req.user?.id ? toId(req.user.id) : null,
      renter_name,
      renter_email: normalizedEmail,
      renter_phone,
      renter_emergency_contact,
      renter_address,
      store_branch_id: String(branchToUse._id),
      store_branch_name: String(branchToUse.name || '').trim(),
      store_branch_address: String(branchToUse.address || '').trim(),
      delivery_mode,
      delivery_address,
      payment_mode,
      lease_agreement_submission_url: lease_agreement_submission_url ? String(lease_agreement_submission_url).trim() : '',
      custom_answers: custom_answers && typeof custom_answers === 'object' ? custom_answers : {},
      form_schema_version: (store as any).rental_form_schema?.version || STANDARD_RENTAL_FORM_VERSION,
      total_amount,
      fraud_flag: Boolean(fraudMatch),
    });

    await OrderItem.insertMany(
      items.map((item: any) => ({
        order_id: order._id,
        item_id: toId(item.id),
        start_date: item.startDate,
        end_date: item.endDate,
        price_per_day: item.daily_price,
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    );

    const docsToInsert: Array<{ order_id: any; document_type: string; file_url: string }> = [];
    if (docs.id1_front) docsToInsert.push({ order_id: order._id, document_type: 'ID1_FRONT', file_url: String(docs.id1_front).trim() });
    if (docs.id1_back) docsToInsert.push({ order_id: order._id, document_type: 'ID1_BACK', file_url: String(docs.id1_back).trim() });
    if (docs.id2_front) docsToInsert.push({ order_id: order._id, document_type: 'ID2_FRONT', file_url: String(docs.id2_front).trim() });
    if (docs.id2_back) docsToInsert.push({ order_id: order._id, document_type: 'ID2_BACK', file_url: String(docs.id2_back).trim() });
    if (docs.selfie_id) docsToInsert.push({ order_id: order._id, document_type: 'SELFIE_ID', file_url: String(docs.selfie_id).trim() });
    if (docs.proof_of_billing) docsToInsert.push({ order_id: order._id, document_type: 'PROOF_OF_BILLING', file_url: String(docs.proof_of_billing).trim() });
    if (docsToInsert.length) await OrderDocument.insertMany(docsToInsert);

    req.app.locals.io?.emit('rental:submitted', { store_id, orderId: order._id.toString() });
    req.app.locals.io?.emit('calendar:update', { store_id });
    if (fraudMatch) req.app.locals.io?.emit('fraud:match_detected', { store_id, orderId: order._id.toString() });

    res.json({ id: order._id.toString() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create order' });
  }
});

orderRoutes.get('/account/orders', authenticate, requireAuth, async (req: AuthedRequest, res) => {
  const userId = toId(req.user!.id);
  const email = (req.user!.email || '').toLowerCase();
  const orders = await Order.find({
    $or: [{ renter_id: userId }, ...(email ? [{ renter_email: email }] : [])],
  })
    .sort({ created_at: -1 })
    .lean();
  const storeIds = orders.map((order) => order.store_id);
  const stores = await Store.find({ _id: { $in: storeIds } }).lean();
  const storesById = new Map(stores.map((store) => [store._id.toString(), store]));

  const payload = [];
  for (const order of orders) {
    const orderItems = await OrderItem.find({ order_id: order._id }).lean();
    const itemIds = orderItems.map((item) => item.item_id);
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    const itemsById = new Map(items.map((item) => [item._id.toString(), item]));

    payload.push({
      ...serialize(order as any),
      store_name: storesById.get(order.store_id.toString())?.name || '',
      items: orderItems.map((orderItem) => {
        const item = itemsById.get(orderItem.item_id.toString());
        return {
          id: orderItem.item_id.toString(),
          name: item?.name || '',
          start_date: orderItem.start_date,
          end_date: orderItem.end_date,
          daily_price: orderItem.price_per_day,
          quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
          image_url: item?.image_url || '',
        };
      }),
    });
  }

  res.json(payload);
});

orderRoutes.get('/orders/:id/details', authenticate, checkRole(['owner', 'admin']), async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const orderItems = await OrderItem.find({ order_id: order._id }).lean();
  const itemIds = orderItems.map((item) => item.item_id);
  const items = await Item.find({ _id: { $in: itemIds } }).lean();
  const itemsById = new Map(items.map((item) => [item._id.toString(), item]));
  const documents = await OrderDocument.find({ order_id: order._id }).lean();

  res.json({
    ...serialize(order as any),
    items: orderItems.map((orderItem) => ({
      ...serialize(itemsById.get(orderItem.item_id.toString()) as any),
      start_date: orderItem.start_date,
      end_date: orderItem.end_date,
      price_per_day: orderItem.price_per_day,
      quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
    })),
    documents: serializeMany(documents as any[]),
  });
});

orderRoutes.post('/orders/:id/approve', authenticate, checkRole(['owner']), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const orderItems = await OrderItem.find({ order_id: order._id }).lean();
  for (const item of orderItems) {
    const conflict = await hasBookingConflictForQuantity(
      item.item_id.toString(),
      item.start_date,
      item.end_date,
      Math.max(1, Number((item as any).quantity) || 1),
      order._id.toString(),
    );
    if (conflict) {
      return res.status(400).json({ error: `Cannot approve: Item ${item.item_id.toString()} has an overlapping approved booking or manual block.` });
    }
  }

  order.status = 'APPROVED';
  order.reviewed_by_owner_at = new Date();
  await order.save();

  req.app.locals.io?.emit('rental:approved', { orderId: order._id.toString(), store_id: order.store_id.toString() });
  req.app.locals.io?.emit('calendar:update', { store_id: order.store_id.toString() });
  res.json({ success: true });
});

orderRoutes.post('/orders/:id/reject', authenticate, checkRole(['owner']), async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'REJECTED';
  order.rejection_reason = reason;
  order.reviewed_by_owner_at = new Date();
  await order.save();

  req.app.locals.io?.emit('rental:rejected', { orderId: order._id.toString(), store_id: order.store_id.toString() });
  req.app.locals.io?.emit('calendar:update', { store_id: order.store_id.toString() });
  res.json({ success: true });
});

orderRoutes.post('/orders/:id/report-fraud', authenticate, checkRole(['owner', 'admin']), async (req: AuthedRequest, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'FRAUD_REPORTED';
  await order.save();

  await FraudList.create({
    store_id: order.store_id,
    full_name: order.renter_name,
    email: order.renter_email,
    contact_number: order.renter_phone,
    billing_address: order.renter_address,
    reason,
    reported_by: toId(req.user!.id),
  });

  req.app.locals.io?.emit('fraud:reported', { orderId: order._id.toString(), store_id: order.store_id.toString() });
  res.json({ success: true });
});

orderRoutes.post('/orders/:id/cancel', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'CANCELLED_BY_OWNER';
  order.cancelled_by = toId(req.user!.id);
  order.cancellation_reason = reason;
  await order.save();

  req.app.locals.io?.emit('booking:cancelled', { orderId: order._id.toString(), store_id: order.store_id.toString() });
  req.app.locals.io?.emit('calendar:update', { store_id: order.store_id.toString() });
  res.json({ success: true });
});

orderRoutes.post('/manual-blocks', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const { item_id, start_date, end_date, reason } = req.body;
  const item = await Item.findById(item_id).lean();
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const block = await ManualBlock.create({
    item_id: toId(item_id),
    start_date,
    end_date,
    reason,
    created_by: toId(req.user!.id),
  });

  req.app.locals.io?.emit('calendar:update', { store_id: item.store_id.toString() });
  res.json({ id: block._id.toString() });
});

orderRoutes.get('/manual-blocks/:itemId', async (req, res) => {
  const blocks = await ManualBlock.find({ item_id: toId(req.params.itemId) }).lean();
  res.json(serializeMany(blocks as any[]));
});

orderRoutes.delete('/manual-blocks/:id', authenticate, checkRole(['owner']), async (req, res) => {
  const block = await ManualBlock.findById(req.params.id);
  if (!block) return res.status(404).json({ error: 'Block not found' });

  const item = await Item.findById(block.item_id).lean();
  await block.deleteOne();
  if (item) req.app.locals.io?.emit('calendar:update', { store_id: item.store_id.toString() });
  res.json({ success: true });
});
