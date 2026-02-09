import { Pool } from 'pg';
import dns from 'dns';
import { config } from '../config';

// Railway internal networking uses IPv6
dns.setDefaultResultOrder('verbatim');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
