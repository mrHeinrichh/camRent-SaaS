import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { DEFAULT_STORE_BANNER_URL, DEFAULT_STORE_LOGO_URL, DEFAULT_USER_AVATAR_URL } from '../config/defaults';
import { env } from '../config/env';
import { authenticate, checkRole, requireAuth } from '../middleware/auth';
import { Store } from '../models/Store';
import { User } from '../models/User';
import type { AuthedRequest } from '../types/auth';
import { validateE164Phone } from '../utils/phone';
import { serialize } from '../utils/mongo';

export const authRoutes = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

authRoutes.post('/register', async (req, res) => {
  const {
    email,
    phone,
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
    tiktok_url,
    custom_social_links,
    tiktokUrl,
    customSocialLinks,
    payment_details,
    payment_detail_images,
    delivery_modes,
    store_branches,
    lease_agreement_file_url,
    security_deposit,
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const phoneCheck = validateE164Phone(phone);
    if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'renter',
      full_name,
      avatar_url: profile_image_url || DEFAULT_USER_AVATAR_URL,
      phone: String(phone || '').trim(),
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
        tiktok_url: String(tiktok_url ?? tiktokUrl ?? '').trim(),
        custom_social_links: Array.isArray(custom_social_links ?? customSocialLinks)
          ? (custom_social_links ?? customSocialLinks).map((url: unknown) => String(url || '').trim()).filter(Boolean)
          : [],
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

authRoutes.post('/google', async (req, res) => {
  if (!googleClient || !env.googleClientId) {
    return res.status(500).json({ error: 'Google sign-in is not configured' });
  }

  const credential = String(req.body?.credential || req.body?.id_token || '').trim();
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || '').trim().toLowerCase();
    const fullName = String(payload?.name || '').trim();
    const avatarUrl = String(payload?.picture || '').trim();

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await User.create({
        email,
        password: randomPassword,
        role: 'renter',
        full_name: fullName || email,
        avatar_url: avatarUrl || DEFAULT_USER_AVATAR_URL,
        phone: '',
      });
      console.log('[auth] google signup', { userId: user._id.toString(), email });
    } else {
      console.log('[auth] google login', { userId: user._id.toString(), email });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account is disabled. Please contact support.' });
    }

    if (!user.full_name && fullName) user.full_name = fullName;
    if (!user.avatar_url && avatarUrl) user.avatar_url = avatarUrl;
    if (user.isModified()) await user.save();

    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
    res.json({ token, user: serialize(user) });
  } catch (error: any) {
    console.error('[auth] google auth failed', { message: error?.message });
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

authRoutes.put('/profile', authenticate, requireAuth, checkRole(['renter']), async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const fullName = String(req.body?.full_name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const avatarUrl = String(req.body?.avatar_url || '').trim();
  const phone = String(req.body?.phone || '').trim();

  if (!fullName) return res.status(400).json({ error: 'Full name is required' });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  const phoneCheck = validateE164Phone(phone);
  if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });

  if (email !== user.email) {
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(400).json({ error: 'Email already exists' });
    user.email = email;
  }

  user.full_name = fullName;
  if (avatarUrl) user.avatar_url = avatarUrl;
  user.phone = phone;
  await user.save();

  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
  res.json({ success: true, token, user: serialize(user as any) });
});
