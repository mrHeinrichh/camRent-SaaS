import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { authenticate, requireAuth } from '../middleware/auth';
import { uploadToCloudinary, uploadToLocal } from '../services/uploadService';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

function toAbsoluteUrl(req: any, maybeRelativeUrl: string) {
  if (maybeRelativeUrl.startsWith('http://') || maybeRelativeUrl.startsWith('https://')) return maybeRelativeUrl;
  return `${req.protocol}://${req.get('host')}${maybeRelativeUrl}`;
}

uploadRoutes.post('/public', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    console.error('[upload/public] cloudinary missing config', {
      cloudName: env.cloudinaryCloudName || null,
      hasApiKey: Boolean(env.cloudinaryApiKey),
      hasApiSecret: Boolean(env.cloudinaryApiSecret),
    });
    return res.status(500).json({ error: 'Cloudinary is not configured' });
  }

  try {
    console.log('[upload/public] incoming file', {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      cloudName: env.cloudinaryCloudName,
    });
    const url = await uploadToCloudinary(req.file, 'camrent/public');
    res.json({ url });
  } catch (error: any) {
    console.error('[upload/public] upload failed', {
      message: error?.message,
      name: error?.name,
      http_code: error?.http_code,
      cloudName: env.cloudinaryCloudName,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
    try {
      const localUrl = await uploadToLocal(req.file, 'public');
      const absoluteUrl = toAbsoluteUrl(req, localUrl);
      console.warn('[upload/public] fallback to local storage', { absoluteUrl, fileName: req.file.originalname });
      return res.json({ url: absoluteUrl, storage: 'local' });
    } catch (localError: any) {
      console.error('[upload/public] local fallback failed', { message: localError?.message });
      return res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
});

uploadRoutes.post('/public/strict-cloudinary', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return res.status(500).json({ error: 'Cloudinary is not configured' });
  }
  try {
    const url = await uploadToCloudinary(req.file, 'camrent/public');
    return res.json({ url, storage: 'cloudinary' });
  } catch (error: any) {
    console.error('[upload/public/strict-cloudinary] upload failed', {
      message: error?.message,
      name: error?.name,
      http_code: error?.http_code,
      cloudName: env.cloudinaryCloudName,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
    return res.status(500).json({ error: 'Cloudinary upload failed. Please check Cloudinary configuration and try again.' });
  }
});

uploadRoutes.post('/', authenticate, requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    console.error('[upload/private] cloudinary missing config', {
      cloudName: env.cloudinaryCloudName || null,
      hasApiKey: Boolean(env.cloudinaryApiKey),
      hasApiSecret: Boolean(env.cloudinaryApiSecret),
    });
    return res.status(500).json({ error: 'Cloudinary is not configured' });
  }

  try {
    console.log('[upload/private] incoming file', {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      cloudName: env.cloudinaryCloudName,
    });
    const url = await uploadToCloudinary(req.file, 'camrent');
    res.json({ url });
  } catch (error: any) {
    console.error('[upload/private] upload failed', {
      message: error?.message,
      name: error?.name,
      http_code: error?.http_code,
      cloudName: env.cloudinaryCloudName,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
    try {
      const localUrl = await uploadToLocal(req.file, 'private');
      const absoluteUrl = toAbsoluteUrl(req, localUrl);
      console.warn('[upload/private] fallback to local storage', { absoluteUrl, fileName: req.file.originalname });
      return res.json({ url: absoluteUrl, storage: 'local' });
    } catch (localError: any) {
      console.error('[upload/private] local fallback failed', { message: localError?.message });
      return res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
});
