import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { Store } from '../../models/Store';
import { Voucher } from '../../models/Voucher';
import type { AuthedRequest } from '../../types/auth';
import { serialize, serializeMany, toId } from '../../utils/mongo';

export function registerOwnerVoucherRoutes(router: Router) {
  router.get('/owner/vouchers', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
    const vouchers = await Voucher.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
    res.json(serializeMany(vouchers as any[]));
  });

  router.post('/owner/vouchers', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
    const code = String(req.body?.code || '').trim().toUpperCase();
    const discountAmount = Number(req.body?.discount_amount);
    if (!code) return res.status(400).json({ error: 'Voucher code is required' });
    if (!Number.isFinite(discountAmount) || discountAmount <= 0) return res.status(400).json({ error: 'Discount amount must be greater than 0' });
    const exists = await Voucher.findOne({ store_id: store._id, code }).lean();
    if (exists) return res.status(400).json({ error: 'Voucher code already exists for your store' });
    const voucher = await Voucher.create({
      store_id: store._id,
      code,
      discount_amount: discountAmount,
      is_active: req.body?.is_active !== false,
      is_used: req.body?.is_used === true,
    });
    res.json({ success: true, voucher: serialize(voucher as any) });
  });

  router.put('/owner/vouchers/:id', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
    const voucher = await Voucher.findOne({ _id: toId(req.params.id), store_id: store._id });
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

    if (req.body?.code !== undefined) {
      const nextCode = String(req.body.code || '').trim().toUpperCase();
      if (!nextCode) return res.status(400).json({ error: 'Voucher code is required' });
      const duplicate = await Voucher.findOne({ store_id: store._id, code: nextCode, _id: { $ne: voucher._id } }).lean();
      if (duplicate) return res.status(400).json({ error: 'Voucher code already exists for your store' });
      voucher.code = nextCode;
    }
    if (req.body?.discount_amount !== undefined) {
      const discountAmount = Number(req.body.discount_amount);
      if (!Number.isFinite(discountAmount) || discountAmount <= 0) return res.status(400).json({ error: 'Discount amount must be greater than 0' });
      voucher.discount_amount = discountAmount;
    }
    if (req.body?.is_active !== undefined) voucher.is_active = Boolean(req.body.is_active);
    if (req.body?.is_used !== undefined) voucher.is_used = Boolean(req.body.is_used);
    await voucher.save();
    res.json({ success: true, voucher: serialize(voucher as any) });
  });
}
