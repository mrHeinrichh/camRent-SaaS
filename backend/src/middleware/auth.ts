import type express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import type { AuthedRequest, JwtPayload } from '../types/auth';

export function authenticate(req: AuthedRequest, _res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    req.user = null;
  }

  next();
}

export async function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findById(req.user.id).lean();
  if (!user || user.is_active === false) return res.status(403).json({ error: 'Account disabled' });
  next();
}

export const checkRole =
  (roles: JwtPayload['role'][]) =>
  async (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findById(req.user.id).lean();
    if (!user || user.is_active === false) return res.status(403).json({ error: 'Account disabled' });
    next();
  };
