import { Router } from 'express';
import { Types } from 'mongoose';
import { DEFAULT_STORE_BANNER_URL, DEFAULT_STORE_LOGO_URL } from '../config/defaults';
import { STANDARD_RENTAL_FORM_VERSION, sanitizeRentalFormFields } from '../forms/rentalForm';
import { authenticate, checkRole } from '../middleware/auth';
import { Item } from '../models/Item';
import { Store } from '../models/Store';
import { enforceStoreDueDeactivation } from '../services/billingService';
import type { AuthedRequest } from '../types/auth';
import { serialize, serializeMany, toId } from '../utils/mongo';

export const storeRoutes = Router();

storeRoutes.get('/', async (_req, res) => {
  await enforceStoreDueDeactivation();
  const stores = await Store.find({ status: 'approved', is_active: true }).lean();
  res.json(serializeMany(stores as any[]));
});

storeRoutes.get('/:id', async (req, res) => {
  await enforceStoreDueDeactivation();
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Store not found' });
  const store = await Store.findById(req.params.id).lean();
  if (!store || store.status !== 'approved' || !store.is_active) return res.status(404).json({ error: 'Store not found' });
  const items = await Item.find({ store_id: store._id, is_available: true, stock: { $gt: 0 } }).lean();
  res.json({ ...serialize(store as any), items: serializeMany(items as any[]) });
});

storeRoutes.get('/:id/rental-form', async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Store not found' });
  const store = await Store.findById(req.params.id).lean();
  if (!store || store.status !== 'approved' || !store.is_active) return res.status(404).json({ error: 'Store not found' });

  const schema = (store as any).rental_form_schema || {};
  const settings = (store as any).rental_form_settings || {};
  const fields = sanitizeRentalFormFields(schema.fields);
  res.json({
    standard_version: STANDARD_RENTAL_FORM_VERSION,
    fields,
    settings: {
      show_branch_map: settings.show_branch_map !== false,
      reference_text: String(settings.reference_text || ''),
      reference_image_url: String(settings.reference_image_url || ''),
      reference_image_position: settings.reference_image_position === 'mid' ? 'mid' : 'top',
    },
  });
});

storeRoutes.post('/', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
  const {
    name,
    description,
    address,
    logo_url,
    banner_url,
    facebook_url,
    instagram_url,
    payment_details,
    payment_detail_images,
    delivery_modes,
    branches,
    lease_agreement_file_url,
    rental_form_schema,
    rental_form_settings,
    security_deposit,
  } =
    req.body;
  const fields = sanitizeRentalFormFields(rental_form_schema?.fields);
  const settingsPayload = rental_form_settings && typeof rental_form_settings === 'object' ? rental_form_settings : {};
  const store = await Store.create({
    owner_id: toId(req.user!.id),
    name,
    description,
    address,
    logo_url: logo_url || DEFAULT_STORE_LOGO_URL,
    banner_url: banner_url || DEFAULT_STORE_BANNER_URL,
    facebook_url: facebook_url || '',
    instagram_url: instagram_url || '',
    payment_details: payment_details || '',
    payment_detail_images: Array.isArray(payment_detail_images) ? payment_detail_images.map((url: unknown) => String(url || '').trim()).filter(Boolean) : [],
    delivery_modes: Array.isArray(delivery_modes) ? delivery_modes.filter((mode) => typeof mode === 'string' && mode.trim()) : [],
    branches: Array.isArray(branches)
      ? branches
          .map((branch: any) => ({
            name: typeof branch?.name === 'string' ? branch.name.trim() : '',
            address: typeof branch?.address === 'string' ? branch.address.trim() : '',
            location_lat: Number.isFinite(Number(branch?.location_lat)) ? Number(branch.location_lat) : null,
            location_lng: Number.isFinite(Number(branch?.location_lng)) ? Number(branch.location_lng) : null,
          }))
          .filter((branch: any) => branch.address)
      : [],
    lease_agreement_file_url: lease_agreement_file_url || '',
    rental_form_schema: { version: STANDARD_RENTAL_FORM_VERSION, fields },
    rental_form_settings: {
      show_branch_map: settingsPayload.show_branch_map !== false,
      reference_text: String(settingsPayload.reference_text || '').trim(),
      reference_image_url: String(settingsPayload.reference_image_url || '').trim(),
      reference_image_position: settingsPayload.reference_image_position === 'mid' ? 'mid' : 'top',
    },
    security_deposit: Number.isFinite(Number(security_deposit)) ? Number(security_deposit) : 0,
  });
  res.json({ id: store._id.toString() });
});
