import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/dashboard64',
  apiKey: process.env.API_KEY || 'change-me-in-production',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
};
