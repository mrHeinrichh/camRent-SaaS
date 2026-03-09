import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_STORE_BANNER_URL, DEFAULT_STORE_LOGO_URL, DEFAULT_USER_AVATAR_URL } from '../config/defaults';
import { env } from '../config/env';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { serialize } from '../utils/mongo';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const {
    email,
    password,
    role,
    full_name,
    profile_image_url,
    store_name,
    store_description,
    store_address,
    store_logo_url,
    store_banner_url,
    store_latitude,
    store_longitude,
    facebook_url,
    instagram_url,
    payment_details,
    payment_detail_images,
    delivery_modes,
    store_branches,
    lease_agreement_file_url,
    security_deposit,
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'renter',
      full_name,
      avatar_url: profile_image_url || DEFAULT_USER_AVATAR_URL,
    });

    if (user.role === 'owner') {
      const lat = Number(store_latitude);
      const lng = Number(store_longitude);
      const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
      if (hasLocation && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
        return res.status(400).json({ error: 'Invalid store map location' });
      }

      const branches = Array.isArray(store_branches)
        ? store_branches
            .map((branch: any) => ({
              name: typeof branch?.name === 'string' ? branch.name.trim() : '',
              address: typeof branch?.address === 'string' ? branch.address.trim() : '',
              location_lat: Number(branch?.location_lat),
              location_lng: Number(branch?.location_lng),
            }))
            .filter((branch: any) => branch.address)
        : [];
      if (!branches.length) {
        return res.status(400).json({ error: 'At least one store branch is required' });
      }
      for (const branch of branches) {
        if (!Number.isFinite(branch.location_lat) || !Number.isFinite(branch.location_lng)) {
          return res.status(400).json({ error: 'Each branch must have a valid pin location (latitude and longitude)' });
        }
        if (branch.location_lat < -90 || branch.location_lat > 90 || branch.location_lng < -180 || branch.location_lng > 180) {
          return res.status(400).json({ error: 'Each branch pin location must be within valid coordinate ranges' });
        }
      }

      const createdStore = await Store.create({
        owner_id: user._id,
        name: store_name || `${full_name || email}'s Store`,
        description: store_description || '',
        address: store_address || '',
        logo_url: store_logo_url || DEFAULT_STORE_LOGO_URL,
        banner_url: store_banner_url || DEFAULT_STORE_BANNER_URL,
        status: 'pending',
        is_active: true,
        location_lat: hasLocation ? lat : null,
        location_lng: hasLocation ? lng : null,
        facebook_url: facebook_url || '',
        instagram_url: instagram_url || '',
        payment_details: payment_details || '',
        payment_detail_images: Array.isArray(payment_detail_images) ? payment_detail_images.map((url: unknown) => String(url || '').trim()).filter(Boolean) : [],
        delivery_modes: Array.isArray(delivery_modes) ? delivery_modes.filter((mode) => typeof mode === 'string' && mode.trim()) : [],
        branches,
        lease_agreement_file_url: lease_agreement_file_url || '',
        security_deposit: Number.isFinite(Number(security_deposit)) ? Number(security_deposit) : 0,
      });

      console.log('[auth] owner registered with store', {
        userId: user._id.toString(),
        email: user.email,
        storeId: createdStore._id.toString(),
        storeName: createdStore.name,
      });
    } else {
      console.log('[auth] renter registered', {
        userId: user._id.toString(),
        email: user.email,
      });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
    res.json({ token, user: serialize(user) });
  } catch (error: any) {
    console.error('[auth] register failed', {
      email,
      role,
      message: error?.message,
    });
    res.status(400).json({ error: 'Email already exists' });
  }
});

authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.warn('[auth] login failed', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.is_active === false) {
    return res.status(403).json({ error: 'Your account is disabled. Please contact support.' });
  }

  console.log('[auth] login success', {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
  res.json({ token, user: serialize(user) });
});
