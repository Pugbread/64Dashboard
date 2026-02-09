import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  next();
}
