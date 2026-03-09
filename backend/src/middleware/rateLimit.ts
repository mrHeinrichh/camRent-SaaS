import type express from 'express';

interface RateLimitEntry {
  windowStartedAt: number;
  requestCount: number;
  cooldownUntil: number;
}

const MAX_REQUESTS = 5;
const WINDOW_MS = 15_000;
const COOLDOWN_MS = 30_000;
const FALLBACK_IMAGE_URL = 'https://placehold.co/1200x630?text=Temporarily+Unavailable';

const buckets = new Map<string, RateLimitEntry>();

function getClientKey(req: express.Request) {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
  const route = String(req.path || '/');
  return `${ip}:${route}`;
}

export function apiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.method === 'OPTIONS') return next();
  const now = Date.now();
  const key = getClientKey(req);
  const current = buckets.get(key);

  if (!current) {
    buckets.set(key, { windowStartedAt: now, requestCount: 1, cooldownUntil: 0 });
    return next();
  }

  if (current.cooldownUntil > now) {
    const cooldownSeconds = Math.max(1, Math.ceil((current.cooldownUntil - now) / 1000));
    return res.status(429).json({
      error: `Too many requests. Please try again in ${cooldownSeconds} second(s).`,
      fallback_message: 'This feature is not available as of the moment. Please try again later.',
      fallback_image_url: FALLBACK_IMAGE_URL,
      cooldown_seconds: cooldownSeconds,
    });
  }

  if (now - current.windowStartedAt > WINDOW_MS) {
    current.windowStartedAt = now;
    current.requestCount = 1;
    current.cooldownUntil = 0;
    buckets.set(key, current);
    return next();
  }

  current.requestCount += 1;
  if (current.requestCount > MAX_REQUESTS) {
    current.cooldownUntil = now + COOLDOWN_MS;
    buckets.set(key, current);
    return res.status(429).json({
      error: 'Rate limit exceeded. Cooldown started.',
      fallback_message: 'This feature is not available as of the moment. Please try again later.',
      fallback_image_url: FALLBACK_IMAGE_URL,
      cooldown_seconds: Math.ceil(COOLDOWN_MS / 1000),
    });
  }

  buckets.set(key, current);
  return next();
}
