import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { FraudList } from '../../models/FraudList';
import { Store } from '../../models/Store';
import type { AuthedRequest } from '../../types/auth';
import { serialize, serializeMany, toId } from '../../utils/mongo';

export function registerOwnerFraudRoutes(router: Router) {
  router.get('/owner/fraud-list', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
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

  router.post('/owner/customers/report-fraud', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
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
}
