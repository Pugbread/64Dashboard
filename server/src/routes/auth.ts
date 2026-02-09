import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

// We hash the admin password on first load for comparison
let hashedPassword: string | null = null;

async function getHashedPassword(): Promise<string> {
  if (!hashedPassword) {
    hashedPassword = await bcrypt.hash(config.adminPassword, 10);
  }
  return hashedPassword;
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    // Direct comparison since we store the plaintext password in env
    if (password !== config.adminPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign({ admin: true }, config.jwtSecret, {
      expiresIn: '24h',
    });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
