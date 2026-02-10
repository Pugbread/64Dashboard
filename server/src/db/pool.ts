import { Pool } from 'pg';
import dns from 'dns';
import { config } from '../config';

// Railway internal networking uses IPv6
dns.setDefaultResultOrder('verbatim');

// Railway's public proxy requires SSL
const useSSL = config.databaseUrl.includes('proxy.rlwy.net') || 
               config.databaseUrl.includes('sslmode=require');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

console.log(`DB pool created, SSL: ${useSSL}`);

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
