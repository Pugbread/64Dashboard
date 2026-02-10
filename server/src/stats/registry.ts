import { Pool } from 'pg';
import { StatProvider, StatResult, Interval } from './types';

// Import all providers
import { dauProvider } from './providers/dau';
import { wauProvider } from './providers/wau';
import { mauProvider } from './providers/mau';
import { avgSessionTimeProvider } from './providers/avgSessionTime';
import { avgPlaytimePerDauProvider } from './providers/avgPlaytimePerDau';
import { avgJoinsPerDauProvider } from './providers/avgJoinsPerDau';
import { revenueProvider } from './providers/revenue';
import { arpdauProvider } from './providers/arpdau';

class StatRegistry {
  private providers: Map<string, StatProvider> = new Map();

  register(provider: StatProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): StatProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): StatProvider[] {
    return Array.from(this.providers.values());
  }

  getProvidersByCategory(category: string): StatProvider[] {
    return this.getAllProviders().filter((p) => p.category === category);
  }

  /** Get all unique categories in registration order */
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

  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /** Get metadata about all registered providers (for the frontend) */
  getProviderMeta(): Array<{
    id: string;
    name: string;
    category: string;
    resultType: string;
    unit?: string;
    format?: string;
  }> {
    return this.getAllProviders().map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      resultType: p.resultType,
      unit: p.unit,
      format: p.format,
    }));
  }

  /** Query multiple providers in parallel */
  async queryMultiple(
    pool: Pool,
    gameId: string,
    from: Date,
    to: Date,
    metricIds?: string[],
    interval?: Interval
  ): Promise<Record<string, StatResult>> {
    const providers = metricIds
      ? metricIds.map((id) => this.providers.get(id)).filter(Boolean) as StatProvider[]
      : this.getAllProviders();

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const result = await provider.query(pool, gameId, from, to, interval);
          return { id: provider.id, result };
        } catch (error) {
          console.error(`Error querying stat provider ${provider.id}:`, error);
          return {
            id: provider.id,
            result: provider.resultType === 'scalar'
              ? { type: 'scalar' as const, value: 0 }
              : { type: 'timeseries' as const, data: [] },
          };
        }
      })
    );

    const resultMap: Record<string, StatResult> = {};
    for (const { id, result } of results) {
      resultMap[id] = result;
    }
    return resultMap;
  }
}

// Create and populate the global registry
export const registry = new StatRegistry();

// Register all default providers
// To add a new stat: import it above and register it here
registry.register(dauProvider);
registry.register(wauProvider);
registry.register(mauProvider);
registry.register(avgSessionTimeProvider);
registry.register(avgPlaytimePerDauProvider);
registry.register(avgJoinsPerDauProvider);
registry.register(revenueProvider);
registry.register(arpdauProvider);
