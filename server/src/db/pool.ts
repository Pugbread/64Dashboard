import { Pool } from 'pg';
import dns from 'dns';
import { config } from '../config';

// Railway internal networking uses IPv6 - prefer IPv4 first to avoid issues
dns.setDefaultResultOrder('ipv4first');

const isInternal = config.databaseUrl.includes('.railway.internal');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: isInternal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
