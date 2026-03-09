import { Router } from 'express';
import multer from 'multer';
import { createHmac, timingSafeEqual } from 'crypto';
import { Readable } from 'stream';
import { URL } from 'url';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { authenticate, requireAuth } from '../middleware/auth';
import { uploadToCloudinary, uploadToLocal } from '../services/uploadService';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

function toAbsoluteUrl(req: any, maybeRelativeUrl: string) {
  if (maybeRelativeUrl.startsWith('http://') || maybeRelativeUrl.startsWith('https://')) return maybeRelativeUrl;
  return `${req.protocol}://${req.get('host')}${maybeRelativeUrl}`;
}

function parseCloudinaryAsset(urlString: string) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('res.cloudinary.com')) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 4) return null;
    const cloudName = parts[0];
    const resourceType = parts[1];
    const deliveryType = parts[2];
    if (deliveryType !== 'upload') return null;
    const uploadIndex = parts.findIndex((segment) => segment === 'upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
    const idParts = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;
    if (!idParts.length) return null;
    const lastPart = idParts[idParts.length - 1];
    const dotIndex = lastPart.lastIndexOf('.');
    const format = dotIndex > 0 ? lastPart.slice(dotIndex + 1).toLowerCase() : '';
    const normalizedLast = dotIndex > 0 ? lastPart.slice(0, dotIndex) : lastPart;
    const publicId = [...idParts.slice(0, -1), normalizedLast].join('/');
    if (!publicId) return null;
    return { cloudName, resourceType, deliveryType, publicId, format };
  } catch {
    return null;
  }
}

function sanitizeFilename(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function pickFileNameFromUrl(fileUrl: string, fallbackBase = 'file') {
  try {
    const parsed = new URL(fileUrl);
    const last = decodeURIComponent((parsed.pathname.split('/').pop() || '').trim());
    if (last) return sanitizeFilename(last);
  } catch {
    // ignore
  }
  return `${fallbackBase}.bin`;
}

function signProxyToken(input: { url: string; mode: 'view' | 'download'; exp: number }) {
  return createHmac('sha256', env.jwtSecret).update(`${input.mode}|${input.exp}|${input.url}`).digest('hex');
}

function verifyProxyToken(input: { url: string; mode: 'view' | 'download'; exp: number; sig: string }) {
  const expected = signProxyToken({ url: input.url, mode: input.mode, exp: input.exp });
  try {
    const a = Buffer.from(input.sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function resolveCloudinaryCandidates(fileUrl: string) {
  const asset = parseCloudinaryAsset(fileUrl);
  if (!asset) return { asset: null, candidates: [fileUrl] as string[], resolved: null as any };

  let resolvedResourceType: 'image' | 'raw' = asset.resourceType === 'raw' ? 'raw' : 'image';
  let resolvedDeliveryType: 'upload' | 'authenticated' | 'private' = 'upload';
  let resolvedFrom: string | null = null;
  const attempts: Array<{ resource_type: 'image' | 'raw'; type: 'upload' | 'authenticated' | 'private'; label: string }> = [
    { resource_type: asset.resourceType === 'raw' ? 'raw' : 'image', type: 'upload', label: 'parsed/upload' },
    { resource_type: 'raw', type: 'upload', label: 'raw/upload' },
    { resource_type: 'image', type: 'upload', label: 'image/upload' },
    { resource_type: 'raw', type: 'private', label: 'raw/private' },
    { resource_type: 'image', type: 'private', label: 'image/private' },
    { resource_type: 'raw', type: 'authenticated', label: 'raw/authenticated' },
    { resource_type: 'image', type: 'authenticated', label: 'image/authenticated' },
  ];

  for (const attempt of attempts) {
    try {
      const resource = await cloudinary.api.resource(asset.publicId, {
        resource_type: attempt.resource_type,
        type: attempt.type,
      });
      if (resource) {
        resolvedResourceType = attempt.resource_type;
        resolvedDeliveryType = attempt.type;
        resolvedFrom = attempt.label;
        break;
      }
    } catch {
      // ignore and continue
    }
  }

  const signedUrl = cloudinary.url(asset.publicId, {
    resource_type: resolvedResourceType as any,
    type: resolvedDeliveryType as any,
    format: asset.format || undefined,
    secure: true,
    sign_url: true,
  });
  const rawUploadUrl = cloudinary.url(asset.publicId, {
    resource_type: 'raw',
    type: 'upload',
    format: asset.format || undefined,
    secure: true,
  });
  const imageUploadUrl = cloudinary.url(asset.publicId, {
    resource_type: 'image',
    type: 'upload',
    format: asset.format || undefined,
    secure: true,
  });

  const candidates = [fileUrl, signedUrl, rawUploadUrl, imageUploadUrl].filter((url, idx, arr) => url && arr.indexOf(url) === idx);
  return {
    asset,
    candidates,
    resolved: {
      resolvedResourceType,
      resolvedDeliveryType,
      resolvedFrom,
      signedUrl,
      rawUploadUrl,
      imageUploadUrl,
    },
  };
}

uploadRoutes.get('/public/access', authenticate, requireAuth, async (req, res) => {
  const fileUrl = String(req.query.url || '').trim();
  if (!fileUrl) return res.status(400).json({ error: 'url is required' });

  const requestId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const cloudinaryData = await resolveCloudinaryCandidates(fileUrl);
    if (cloudinaryData.asset && cloudinaryData.asset.cloudName !== env.cloudinaryCloudName) {
      console.warn('[upload/public/access] cloud_name mismatch', {
        requestId,
        url: fileUrl,
        parsedCloudName: cloudinaryData.asset.cloudName,
        configuredCloudName: env.cloudinaryCloudName,
      });
    }

    const encodedUrl = encodeURIComponent(fileUrl);
    const exp = Date.now() + 1000 * 60 * 10;
    const viewSig = signProxyToken({ url: fileUrl, mode: 'view', exp });
    const downloadSig = signProxyToken({ url: fileUrl, mode: 'download', exp });
    const viewUrl = `/api/upload/public/proxy?mode=view&exp=${exp}&sig=${viewSig}&url=${encodedUrl}`;
    const downloadUrl = `/api/upload/public/proxy?mode=download&exp=${exp}&sig=${downloadSig}&url=${encodedUrl}`;
    console.log('[upload/public/access] resolved', {
      requestId,
      url: fileUrl,
      cloudinary: cloudinaryData.asset
        ? {
            cloudName: cloudinaryData.asset.cloudName,
            publicId: cloudinaryData.asset.publicId,
            format: cloudinaryData.asset.format,
            resourceType: cloudinaryData.asset.resourceType,
            deliveryType: cloudinaryData.asset.deliveryType,
            resolved: cloudinaryData.resolved,
            candidateCount: cloudinaryData.candidates.length,
          }
        : null,
      proxyViewUrl: viewUrl,
      proxyDownloadUrl: downloadUrl,
    });
    return res.json({ view_url: viewUrl, download_url: downloadUrl, request_id: requestId });
  } catch (error: any) {
    console.error('[upload/public/access] failed', { requestId, url: fileUrl, message: error?.message });
    return res.status(500).json({ error: 'Failed to prepare file access' });
  }
});

uploadRoutes.get('/public/proxy', async (req, res) => {
  const fileUrl = String(req.query.url || '').trim();
  const mode = String(req.query.mode || 'view').trim() === 'download' ? 'download' : 'view';
  const exp = Number.parseInt(String(req.query.exp || ''), 10);
  const sig = String(req.query.sig || '').trim();
  if (!fileUrl) return res.status(400).json({ error: 'url is required' });

  const requestId = `prx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (!Number.isFinite(exp) || !sig) {
    console.warn('[upload/public/proxy] missing signature', { requestId, mode, hasExp: Number.isFinite(exp), hasSig: Boolean(sig), url: fileUrl });
    return res.status(401).json({ error: 'Unauthorized proxy access', request_id: requestId });
  }
  if (exp < Date.now()) {
    console.warn('[upload/public/proxy] expired signature', { requestId, mode, exp, now: Date.now(), url: fileUrl });
    return res.status(401).json({ error: 'Proxy link expired', request_id: requestId });
  }
  if (!verifyProxyToken({ url: fileUrl, mode, exp, sig })) {
    console.warn('[upload/public/proxy] invalid signature', { requestId, mode, exp, url: fileUrl });
    return res.status(401).json({ error: 'Unauthorized proxy access', request_id: requestId });
  }

  try {
    const cloudinaryData = await resolveCloudinaryCandidates(fileUrl);
    const fileName = pickFileNameFromUrl(fileUrl, mode === 'download' ? 'download' : 'file');
    const privateCandidates: string[] = [];
    if (cloudinaryData.asset?.publicId && cloudinaryData.asset.format) {
      try {
        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 10;
        const privateUrl = cloudinary.utils.private_download_url(cloudinaryData.asset.publicId, cloudinaryData.asset.format, {
          resource_type: cloudinaryData.resolved?.resolvedResourceType || 'image',
          type: cloudinaryData.resolved?.resolvedDeliveryType || 'upload',
          attachment: mode === 'download',
          expires_at: expiresAt,
        } as any);
        if (privateUrl) privateCandidates.push(privateUrl);
      } catch (error: any) {
        console.warn('[upload/public/proxy] private_download_url generation failed', {
          requestId,
          mode,
          message: error?.message,
          publicId: cloudinaryData.asset.publicId,
          format: cloudinaryData.asset.format,
        });
      }
    }
    const candidates = [...privateCandidates, ...cloudinaryData.candidates].filter((url, idx, arr) => arr.indexOf(url) === idx);
    console.log('[upload/public/proxy] start', {
      requestId,
      mode,
      url: fileUrl,
      cloudinary: cloudinaryData.asset
        ? {
            cloudName: cloudinaryData.asset.cloudName,
            publicId: cloudinaryData.asset.publicId,
            format: cloudinaryData.asset.format,
            resourceType: cloudinaryData.asset.resourceType,
            deliveryType: cloudinaryData.asset.deliveryType,
            resolved: cloudinaryData.resolved,
          }
        : null,
      privateCandidates: privateCandidates.map((candidate) => candidate.slice(0, 160)),
      candidates: candidates.map((candidate) => candidate.slice(0, 160)),
    });

    let lastError: string | null = null;
    for (const candidate of candidates) {
      try {
        const remoteResponse = await fetch(candidate);
        if (!remoteResponse.ok || !remoteResponse.body) {
          lastError = `status ${remoteResponse.status}`;
          let snippet = '';
          try {
            snippet = (await remoteResponse.text()).slice(0, 220);
          } catch {
            // ignore
          }
          console.warn('[upload/public/proxy] candidate failed', {
            requestId,
            mode,
            candidate: candidate.slice(0, 200),
            status: remoteResponse.status,
            bodySnippet: snippet,
          });
          continue;
        }

        const contentType = remoteResponse.headers.get('content-type') || 'application/octet-stream';
        const contentLength = remoteResponse.headers.get('content-length');
        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Cache-Control', 'private, no-store, max-age=0');
        if (mode === 'download') {
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        } else {
          res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }

        console.log('[upload/public/proxy] success', {
          requestId,
          mode,
          candidate: candidate.slice(0, 200),
          status: remoteResponse.status,
          contentType,
          contentLength,
        });

        Readable.fromWeb(remoteResponse.body as any).pipe(res);
        return;
      } catch (candidateError: any) {
        lastError = candidateError?.message || 'request failed';
        console.warn('[upload/public/proxy] candidate error', {
          requestId,
          mode,
          candidate: candidate.slice(0, 200),
          message: candidateError?.message,
        });
      }
    }

    console.error('[upload/public/proxy] failed all candidates', { requestId, mode, url: fileUrl, lastError });
    return res.status(502).json({ error: `Failed to ${mode} file`, request_id: requestId, detail: lastError || 'unknown' });
  } catch (error: any) {
    console.error('[upload/public/proxy] fatal', { requestId, mode, url: fileUrl, message: error?.message });
    return res.status(500).json({ error: `Failed to ${mode} file`, request_id: requestId });
  }
});

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
