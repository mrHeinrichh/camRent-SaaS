import type express from 'express';

interface AuthAttemptEntry {
  windowStartedAt: number;
  failedCount: number;
  cooldownUntil: number;
  cooldownStrikes: number;
}

// Only these auth endpoints are throttled (the "attempt" actions).
const GUARDED_PATHS = new Set([
  '/login',
  '/register',
  '/send-otp',
  '/verify-otp',
  '/google',
]);

const WINDOW_MS = 60_000; // rolling window for counting failed attempts
const MAX_FAILED_ATTEMPTS = 5; // failures allowed per window before cooldown
const BASE_COOLDOWN_MS = 60_000; // first cooldown length
const MAX_COOLDOWN_MS = 15 * 60_000; // cap escalating cooldown at 15 min

const buckets = new Map<string, AuthAttemptEntry>();

function keyFor(req: express.Request): string {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
  const path = String(req.path || '/');
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${ip}:${path}:${email}`;
}

/**
 * Stricter cooldown for repeated login / register / OTP attempts. Only failed
 * attempts (HTTP >= 400) count; a successful auth resets the counter. After
 * [MAX_FAILED_ATTEMPTS] failures within the window, further attempts are blocked
 * with an escalating cooldown (1 min, then longer, capped at 15 min).
 */
export function authRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.method !== 'POST' || !GUARDED_PATHS.has(req.path)) return next();

  const now = Date.now();
  const key = keyFor(req);
  const entry =
    buckets.get(key) ||
    { windowStartedAt: now, failedCount: 0, cooldownUntil: 0, cooldownStrikes: 0 };

  // Currently cooling down → reject.
  if (entry.cooldownUntil > now) {
    const seconds = Math.ceil((entry.cooldownUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many attempts. Please wait ${seconds} second(s) before trying again.`,
      cooldown_seconds: seconds,
    });
  }

  // Reset the window if it elapsed.
  if (now - entry.windowStartedAt > WINDOW_MS) {
    entry.windowStartedAt = now;
    entry.failedCount = 0;
  }

  // Record the outcome once the response is sent.
  res.on('finish', () => {
    const e =
      buckets.get(key) ||
      { windowStartedAt: now, failedCount: 0, cooldownUntil: 0, cooldownStrikes: 0 };

    if (res.statusCode < 400) {
      // Successful attempt clears the record.
      buckets.delete(key);
      return;
    }
    if (res.statusCode === 429) return; // already throttled; don't double-count

    e.failedCount += 1;
    if (e.failedCount >= MAX_FAILED_ATTEMPTS) {
      e.cooldownStrikes += 1;
      const cooldown = Math.min(BASE_COOLDOWN_MS * e.cooldownStrikes, MAX_COOLDOWN_MS);
      e.cooldownUntil = Date.now() + cooldown;
      e.failedCount = 0;
      e.windowStartedAt = Date.now();
    }
    buckets.set(key, e);
  });

  buckets.set(key, entry);
  return next();
}
