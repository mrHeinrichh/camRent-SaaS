import type { Router } from 'express';
import { STANDARD_RENTAL_FORM_VERSION, sanitizeRentalFormFields } from '../../forms/rentalForm';
import { authenticate, checkRole } from '../../middleware/auth';
import { Store } from '../../models/Store';
import type { AuthedRequest } from '../../types/auth';
import { toId } from '../../utils/mongo';

export function registerOwnerRentalFormRoutes(router: Router) {
  router.get('/owner/rental-form', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
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

  router.put('/owner/rental-form', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
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
}
