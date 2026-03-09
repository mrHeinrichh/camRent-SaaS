import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { Store } from '../../models/Store';
import type { AuthedRequest } from '../../types/auth';
import { serialize, toId } from '../../utils/mongo';

export function registerOwnerStoreProfileRoutes(router: Router) {
  router.put('/owner/store-profile', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    try {
      const store = await Store.findOne({ owner_id: toId(req.user!.id) });
      if (!store) return res.status(404).json({ error: 'No store found for this owner account' });

      const body = req.body || {};
      console.log('[owner/store-profile] update request', {
        ownerId: req.user?.id,
        storeId: store._id.toString(),
        keys: Object.keys(body || {}),
        branchesCount: Array.isArray(body.branches) ? body.branches.length : undefined,
        paymentImageCount: Array.isArray(body.payment_detail_images) ? body.payment_detail_images.length : undefined,
      });

      if (body.name !== undefined) store.name = String(body.name || '').trim();
      if (body.description !== undefined) store.description = String(body.description || '').trim();
      if (body.address !== undefined) store.address = String(body.address || '').trim();
      if (body.logo_url !== undefined) store.logo_url = String(body.logo_url || '').trim();
      if (body.banner_url !== undefined) store.banner_url = String(body.banner_url || '').trim();
      if (body.facebook_url !== undefined) store.facebook_url = String(body.facebook_url || '').trim();
      if (body.instagram_url !== undefined) store.instagram_url = String(body.instagram_url || '').trim();
      if (body.tiktok_url !== undefined || body.tiktokUrl !== undefined) {
        store.tiktok_url = String(body.tiktok_url ?? body.tiktokUrl ?? '').trim();
      }
      const customSocialLinksPayload = body.custom_social_links ?? body.customSocialLinks;
      if (Array.isArray(customSocialLinksPayload)) {
        store.custom_social_links = customSocialLinksPayload.map((url: unknown) => String(url || '').trim()).filter(Boolean);
      }
      if (body.payment_details !== undefined) store.payment_details = String(body.payment_details || '').trim();
      if (Array.isArray(body.payment_detail_images)) {
        store.payment_detail_images = body.payment_detail_images.map((url: unknown) => String(url || '').trim()).filter(Boolean);
      }
      if (body.location_lat !== undefined) store.location_lat = Number.isFinite(Number(body.location_lat)) ? Number(body.location_lat) : null;
      if (body.location_lng !== undefined) store.location_lng = Number.isFinite(Number(body.location_lng)) ? Number(body.location_lng) : null;
      if (Array.isArray(body.delivery_modes)) {
        store.delivery_modes = body.delivery_modes.map((mode: unknown) => String(mode || '').trim()).filter(Boolean);
      }
      if (Array.isArray(body.branches)) {
        store.branches = body.branches
          .map((branch: any) => ({
            name: typeof branch?.name === 'string' ? branch.name.trim() : '',
            address: typeof branch?.address === 'string' ? branch.address.trim() : '',
            location_lat: Number.isFinite(Number(branch?.location_lat)) ? Number(branch.location_lat) : null,
            location_lng: Number.isFinite(Number(branch?.location_lng)) ? Number(branch.location_lng) : null,
          }))
          .filter((branch: any) => branch.address);
      }

      if (!store.name) return res.status(400).json({ error: 'Store name is required' });
      if (!store.address) return res.status(400).json({ error: 'Store address is required' });

      await store.save();
      console.log('[owner/store-profile] update success', {
        ownerId: req.user?.id,
        storeId: store._id.toString(),
        branchesCount: Array.isArray((store as any).branches) ? (store as any).branches.length : 0,
        paymentImageCount: Array.isArray((store as any).payment_detail_images) ? (store as any).payment_detail_images.length : 0,
      });
      res.json({ success: true, store: serialize(store as any) });
    } catch (error: any) {
      console.error('[owner/store-profile] update failed', {
        ownerId: req.user?.id,
        message: error?.message,
        stack: error?.stack,
      });
      res.status(500).json({ error: 'Failed to update store profile' });
    }
  });
}
