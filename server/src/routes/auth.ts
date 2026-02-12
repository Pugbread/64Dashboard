import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

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
