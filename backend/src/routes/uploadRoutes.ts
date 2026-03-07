import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { authenticate, requireAuth } from '../middleware/auth';
import { uploadToCloudinary } from '../services/uploadService';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post('/', authenticate, requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return res.status(500).json({ error: 'Cloudinary is not configured' });
  }

  try {
    const url = await uploadToCloudinary(req.file, 'camrent');
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});
