export type CacheLoadResult<T> = {
  value: T;
  fetchedAt: number;
  stale: boolean;
  staleReason: string | null;
  fromCache: boolean;
};

type CacheEntry = {
  inFlight?: Promise<CacheLoadResult<unknown>>;
  lastSuccess?: {
    value: unknown;
    fetchedAt: number;
  };
};

function stableParamsKey(params: Record<string, unknown>): string {
  const keys = Object.keys(params).sort();
  return JSON.stringify(keys.map((key) => [key, params[key]]));
}

export class HandlerCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number) {}

  cacheKey(companyId: string, handlerKey: string, params: Record<string, unknown>): string {
    return `${companyId}:${handlerKey}:${stableParamsKey(params)}`;
  }

  clear(): void {
    this.entries.clear();
  }

  async load<T>(
    key: string,
    loader: () => Promise<T>,
    options?: { bypassCache?: boolean }
  ): Promise<CacheLoadResult<T>> {
    const entry = this.entries.get(key) ?? {};
    this.entries.set(key, entry);

    const now = Date.now();
    if (
      !options?.bypassCache &&
      entry.lastSuccess &&
      now - entry.lastSuccess.fetchedAt <= this.ttlMs
    ) {
      return {
        value: entry.lastSuccess.value as T,
        fetchedAt: entry.lastSuccess.fetchedAt,
        stale: false,
        staleReason: null,
        fromCache: true
      };
    }

    if (entry.inFlight) {
      return (await entry.inFlight) as CacheLoadResult<T>;
    }

    const inFlight = (async (): Promise<CacheLoadResult<T>> => {
      try {
        const value = await loader();
        const fetchedAt = Date.now();
        entry.lastSuccess = { value, fetchedAt };
        return {
          value,
          fetchedAt,
          stale: false,
          staleReason: null,
          fromCache: false
        };
      } catch (error) {
        if (entry.lastSuccess) {
          return {
            value: entry.lastSuccess.value as T,
            fetchedAt: entry.lastSuccess.fetchedAt,
            stale: true,
            staleReason: error instanceof Error ? error.message : String(error),
            fromCache: true
          };
        }
        throw error;
      } finally {
        entry.inFlight = undefined;
      }
    })();

    entry.inFlight = inFlight as Promise<CacheLoadResult<unknown>>;
    return inFlight;
  }
}

export const sharedHandlerCache = new HandlerCache(15_000);
