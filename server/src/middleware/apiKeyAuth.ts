import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const expected = config.apiKey;
  if (
    apiKey.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected))
  ) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  next();
}
