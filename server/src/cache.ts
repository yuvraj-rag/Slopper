// This defines the types to avoid creating a new file not in the spec
export interface FoodItem {
  id: string; // "usda:<id>" or "off:<id>"
  name: string;
  /** Original API label used for relevance matching */
  rawName?: string;
  brand?: string;
  imageUrl?: string;
  nutrientsPer100g: {
    energyKcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    fiber: number | null;
  };
}

export interface SearchPagination {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchEnvelope {
  results: FoodItem[];
  partial: boolean;
  failedSources: ("usda" | "off")[];
  pagination: SearchPagination;
}

interface CacheEntry {
  envelope: SearchEnvelope;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getFromCache(key: string): SearchEnvelope | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.envelope;
}

export function setInCache(key: string, envelope: SearchEnvelope, ttlMs: number): void {
  cache.set(key, {
    envelope,
    expiresAt: Date.now() + ttlMs,
  });
}

export function __clearCacheForTesting(): void {
  cache.clear();
}
