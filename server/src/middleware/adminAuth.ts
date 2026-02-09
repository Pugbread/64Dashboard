import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  admin?: boolean;
}

export function adminAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { admin: boolean };
    if (decoded.admin) {
      req.admin = true;
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
