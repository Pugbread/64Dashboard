import { Pool } from 'pg';
import dns from 'dns';
import { config } from '../config';

// Railway internal networking resolves to both IPv4/IPv6
dns.setDefaultResultOrder('verbatim');

// Use SSL for public proxy connections, plain for internal
const useSSL = config.databaseUrl.includes('proxy.rlwy.net') ||
               config.databaseUrl.includes('sslmode=require');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
