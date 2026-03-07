import type express from 'express';

export type JwtPayload = {
  id: string;
  role: 'renter' | 'owner' | 'admin';
  email: string;
};

export type AuthedRequest = express.Request & {
  user?: JwtPayload | null;
};
