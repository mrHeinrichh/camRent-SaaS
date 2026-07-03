import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { DEFAULT_STORE_BANNER_URL, DEFAULT_STORE_LOGO_URL, DEFAULT_USER_AVATAR_URL } from '../config/defaults';
import { env } from '../config/env';
import { authenticate, checkRole, requireAuth } from '../middleware/auth';
import { EmailOtp } from '../models/EmailOtp';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { sendOtpEmail, sendOwnerRegistrationNotification } from '../services/emailService';
import { notifyAdmins } from '../services/notificationService';
import type { AuthedRequest } from '../types/auth';
import { validateE164Phone } from '../utils/phone';
import { serialize } from '../utils/mongo';

export const authRoutes = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const OTP_EXPIRES_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

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
    rental_billing_mode,
  } = req.body;
  let ownerRegistrationNotification:
    | {
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string;
        storeName: string;
        storeAddress: string;
        storeId: string;
        userId: string;
      }
    | null = null;
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = role || 'renter';
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (normalizedRole) {
      const otpRecord = await EmailOtp.findOne({ email: normalizedEmail, verified_at: { $ne: null } }).sort({ created_at: -1 });
      if (!otpRecord || otpRecord.expires_at.getTime() < Date.now()) {
        return res.status(400).json({ error: 'Email verification is required' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const phoneCheck = validateE164Phone(phone);
    if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
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
        lease_agreement_file_url: String(lease_agreement_file_url || '').trim() || null,
        security_deposit: Number.isFinite(Number(security_deposit)) ? Number(security_deposit) : 0,
        rental_billing_mode: rental_billing_mode === 'calendar_day' ? 'calendar_day' : 'twenty_four_hour',
      });

      console.log('[auth] owner registered with store', {
        userId: user._id.toString(),
        email: user.email,
        storeId: createdStore._id.toString(),
        storeName: createdStore.name,
      });
      ownerRegistrationNotification = {
        ownerName: String(full_name || '').trim(),
        ownerEmail: user.email,
        ownerPhone: String(phone || '').trim(),
        storeName: String(createdStore.name || '').trim(),
        storeAddress: String(createdStore.address || '').trim(),
        storeId: createdStore._id.toString(),
        userId: user._id.toString(),
      };
    } else {
      console.log('[auth] renter registered', {
        userId: user._id.toString(),
        email: user.email,
      });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
    res.json({ token, user: serialize(user) });

    if (ownerRegistrationNotification) {
      notifyAdmins({
        type: 'store_registered',
        title: 'New store registration',
        body: `${ownerRegistrationNotification.ownerName || ownerRegistrationNotification.ownerEmail} registered "${ownerRegistrationNotification.storeName}" and is awaiting approval.`,
        data: { store_id: ownerRegistrationNotification.storeId },
      }).catch((notificationError: any) => {
        console.error('[auth] admin in-app notification failed', { message: notificationError?.message });
      });
      sendOwnerRegistrationNotification(ownerRegistrationNotification).catch((notificationError: any) => {
        console.error('[auth] owner registration notification failed', {
          userId: ownerRegistrationNotification?.userId,
          email: ownerRegistrationNotification?.ownerEmail,
          storeId: ownerRegistrationNotification?.storeId,
          message: notificationError?.message,
          details: notificationError?.details,
        });
      });
    }

    EmailOtp.deleteMany({ email: normalizedEmail }).catch((otpCleanupError: any) => {
      console.error('[auth] otp cleanup failed after registration', {
        email: normalizedEmail,
        message: otpCleanupError?.message,
      });
    });
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

const sendOtpHandler = async (req: any, res: any) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const latest = await EmailOtp.findOne({ email }).sort({ created_at: -1 });
  if (latest && !latest.sent_at) {
    await EmailOtp.deleteMany({ email });
  } else if (latest?.sent_at) {
    const elapsed = Date.now() - latest.sent_at.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const remaining = Math.ceil((OTP_RESEND_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
      return res.status(429).json({ error: `Please wait ${remaining}s before requesting another code.` });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  await EmailOtp.deleteMany({ email });
  const otpRecord = await EmailOtp.create({ email, code_hash: codeHash, expires_at: expiresAt, attempts: 0 });

  try {
    await sendOtpEmail({ to: email, code, expiresMinutes: OTP_EXPIRES_MINUTES });
    otpRecord.sent_at = new Date();
    await otpRecord.save();
  } catch (error: any) {
    console.error('[auth] send otp failed', {
      email,
      message: error?.message,
      details: error?.details,
    });
    await EmailOtp.deleteMany({ email });
    return res.status(error?.statusCode || 500).json({ error: error?.publicMessage || 'Unable to send verification email' });
  }

  res.json({ success: true, expires_in: OTP_EXPIRES_MINUTES * 60 });
};

const verifyOtpHandler = async (req: any, res: any) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  const record = await EmailOtp.findOne({ email }).sort({ created_at: -1 });
  if (!record) {
    return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
  }
  if (record.expires_at.getTime() < Date.now()) {
    await EmailOtp.deleteMany({ email });
    return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await EmailOtp.deleteMany({ email });
    return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
  }

  const ok = await bcrypt.compare(code, record.code_hash);
  if (!ok) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  record.verified_at = new Date();
  await record.save();
  res.json({ success: true });
};

authRoutes.post('/send-otp', sendOtpHandler);
authRoutes.post('/verify-otp', verifyOtpHandler);
authRoutes.post('/owner/send-otp', sendOtpHandler);
authRoutes.post('/owner/verify-otp', verifyOtpHandler);

authRoutes.post('/google', async (req, res) => {
  if (!googleClient || !env.googleClientIds.length) {
    return res.status(500).json({ error: 'Google sign-in is not configured' });
  }

  const credential = String(req.body?.credential || req.body?.id_token || '').trim();
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }
  // Sent by the mobile "Sign up with Google" button: create a renter account
  // on first Google sign-in instead of rejecting unknown emails.
  const allowCreate = req.body?.allow_create === true;

  // Logging-only peek at the unverified token so misconfigured audiences are
  // visible in the logs (verification below is what actually gates access).
  const unsafeClaims = (() => {
    try {
      return JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString('utf8'));
    } catch {
      return null;
    }
  })();
  console.log('[auth] google credential received', {
    allowCreate,
    tokenAud: unsafeClaims?.aud,
    tokenIss: unsafeClaims?.iss,
    tokenEmail: unsafeClaims?.email,
    acceptedAudiences: env.googleClientIds,
  });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientIds,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || '').trim().toLowerCase();
    const fullName = String(payload?.name || '').trim();
    const avatarUrl = String(payload?.picture || '').trim();

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    let user = await User.findOne({ email });
    if (!user && allowCreate) {
      // Google already verified the email. The random password can be reset
      // later; these accounts normally keep signing in via Google.
      const randomPassword = await bcrypt.hash(`google:${email}:${Date.now()}:${Math.random()}`, 10);
      user = await User.create({
        email,
        password: randomPassword,
        role: 'renter',
        full_name: fullName,
        avatar_url: avatarUrl || DEFAULT_USER_AVATAR_URL,
      });
      console.log('[auth] google sign-up created renter', { userId: user._id.toString(), email });
    }
    if (!user) {
      console.warn('[auth] google login missing account', { email });
      return res.status(404).json({
        error: 'No account exists for this Google email. Please register an account first.',
        code: 'GOOGLE_ACCOUNT_NOT_FOUND',
        email,
      });
    }

    console.log('[auth] google login', { userId: user._id.toString(), email });

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account is disabled. Please contact support.' });
    }

    if (!user.full_name && fullName) user.full_name = fullName;
    if (!user.avatar_url && avatarUrl) user.avatar_url = avatarUrl;
    if (user.isModified()) await user.save();

    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
    res.json({ token, user: serialize(user) });
  } catch (error: any) {
    console.error('[auth] google auth failed', {
      message: error?.message,
      tokenAud: unsafeClaims?.aud,
      acceptedAudiences: env.googleClientIds,
      hint: 'If tokenAud is not in acceptedAudiences, add it to GOOGLE_CLIENT_IDS.',
    });
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
