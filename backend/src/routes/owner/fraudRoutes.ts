import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { FraudList } from '../../models/FraudList';
import { Store } from '../../models/Store';
import type { AuthedRequest } from '../../types/auth';
import { serialize, serializeMany, toId } from '../../utils/mongo';

export function registerOwnerFraudRoutes(router: Router) {
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

    const { full_name, email, contact_number, requirement_files, reason, scope, evidence_image_url } = req.body || {};
    if (!full_name || !email) return res.status(400).json({ error: 'Full name and email are required' });
    if (Array.isArray(requirement_files) && requirement_files.length > 5) {
      return res.status(400).json({ error: 'You can upload up to 5 requirement files only' });
    }
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
      full_name: normalize(full_name),
      email: normalizeEmail(email),
      contact_number: normalize(contact_number),
      billing_address: '',
      id_number: '',
      id_numbers: [],
      requirement_files: sanitizeRequirementFiles(requirement_files),
      reason: String(reason || '').trim(),
      evidence_image_url: String(evidence_image_url || '').trim(),
      global_request_reason: normalizedScope === 'global' ? String(reason || '').trim() : '',
      reported_by: toId(req.user!.id),
    });

    res.json({ success: true, fraud: serialize(entry as any) });
  });
}
