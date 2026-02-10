import { Pool } from 'pg';
import { StatProvider, StatResult, Interval } from './types';

import { activeUsersProvider } from './providers/activeUsers';
import { avgSessionTimeProvider } from './providers/avgSessionTime';
import { avgPlaytimeProvider } from './providers/avgPlaytime';
import { avgJoinsProvider } from './providers/avgJoins';
import { revenueProvider } from './providers/revenue';
import { arpuProvider } from './providers/arpu';

class StatRegistry {
  private providers: Map<string, StatProvider> = new Map();

  register(provider: StatProvider): void {
    this.providers.set(provider.id, provider);
  }

  getAllProviders(): StatProvider[] {
    return Array.from(this.providers.values());
  }

  getProvidersByCategory(category: string): StatProvider[] {
    return this.getAllProviders().filter((p) => p.category === category);
  }

  getCategories(): string[] {
    const seen = new Set<string>();
    const categories: string[] = [];
    for (const p of this.providers.values()) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        categories.push(p.category);
      }
    }
    return categories;
  }

  getProviderMeta(category?: string) {
    const list = category ? this.getProvidersByCategory(category) : this.getAllProviders();
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      format: p.format,
    }));
  }

  async queryCategory(
    pool: Pool,
    gameId: string,
    category: string,
    from: Date,
    to: Date,
    interval: Interval
  ): Promise<Record<string, StatResult>> {
    const providers = this.getProvidersByCategory(category);
    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const result = await provider.query(pool, gameId, from, to, interval);
          return { id: provider.id, result };
        } catch (error) {
          console.error(`Error querying ${provider.id}:`, error);
          return { id: provider.id, result: { type: 'timeseries' as const, data: [] } };
        }
      })
    );
    const map: Record<string, StatResult> = {};
    for (const { id, result } of results) map[id] = result;
    return map;
  }
}

export const registry = new StatRegistry();

// ── Register providers (add new ones here) ──────────────────
registry.register(activeUsersProvider);
registry.register(avgSessionTimeProvider);
registry.register(avgPlaytimeProvider);
registry.register(avgJoinsProvider);
registry.register(revenueProvider);
registry.register(arpuProvider);
