import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, require critical env vars to be explicitly set
if (isProduction) {
  const required = ['API_KEY', 'ADMIN_PASSWORD', 'JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/dashboard64',
  apiKey: process.env.API_KEY || 'change-me-in-production',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
};
