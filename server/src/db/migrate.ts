import { Pool } from 'pg';

const migrations = [
  {
    name: '001_initial_schema',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        universe_id TEXT,
        icon_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        product_type TEXT NOT NULL CHECK (product_type IN ('gamepass', 'devproduct')),
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        price_robux INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custom_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_game_started ON sessions(game_id, started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_game_player ON sessions(game_id, player_id, started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_ended ON sessions(game_id, ended_at);
      CREATE INDEX IF NOT EXISTS idx_purchases_game_created ON purchases(game_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_custom_events_game_created ON custom_events(game_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_custom_events_name ON custom_events(game_id, event_name, created_at);

      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '002_add_universe_id',
    sql: `
      ALTER TABLE games ADD COLUMN IF NOT EXISTS universe_id TEXT;
    `,
  },
];

export async function runMigrations(pool: Pool): Promise<void> {
  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const migration of migrations) {
    const { rows } = await pool.query(
      'SELECT name FROM _migrations WHERE name = $1',
      [migration.name]
    );

    if (rows.length === 0) {
      console.log(`Running migration: ${migration.name}`);
      await pool.query(migration.sql);
      await pool.query(
        'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [migration.name]
      );
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }

  console.log('All migrations up to date');
}
