import { searchUSDA } from '../api-clients/usda';
import { searchOFF } from '../api-clients/off';
import { normalizeUSDA } from '../normalize/usda';
import { normalizeOFF } from '../normalize/off';
import { mergeAndRankResults } from '../normalize/merge';
import type { FoodItem, SearchEnvelope } from '../cache';
import { config } from '../config';

const USDA_PAGE_SIZE = 50;
const OFF_PAGE_SIZE = 24;
const MAX_UPSTREAM_PAGES_PER_SOURCE = 4;
const MAX_UPSTREAM_RESULTS = 5000;

interface SearchSession {
  query: string;
  pool: FoodItem[];
  ranked: FoodItem[];
  failedSources: ('usda' | 'off')[];
  usdaTotalHits: number;
  offTotalCount: number;
  expiresAt: number;
}

const sessions = new Map<string, SearchSession>();

function sessionKey(query: string): string {
  return query.toLowerCase();
}

function dedupeById(items: FoodItem[]): FoodItem[] {
  const seen = new Set<string>();
  const out: FoodItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }

  return out;
}

function getOrCreateSession(query: string): SearchSession {
  const key = sessionKey(query);
  const existing = sessions.get(key);
  if (existing && Date.now() < existing.expiresAt) {
    return existing;
  }

  const session: SearchSession = {
    query,
    pool: [],
    ranked: [],
    failedSources: [],
    usdaTotalHits: 0,
    offTotalCount: 0,
    expiresAt: Date.now() + config.CACHE_TTL_MS,
  };

  sessions.set(key, session);
  return session;
}

async function fetchPageWindow(query: string, page: number): Promise<{
  pool: FoodItem[];
  failedSources: ('usda' | 'off')[];
  usdaTotalHits: number;
  offTotalCount: number;
}> {
  const pageCount = Math.min(Math.max(1, page), MAX_UPSTREAM_PAGES_PER_SOURCE);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  const usdaResults = await Promise.allSettled(
    pageNumbers.map((targetPage) => searchUSDA(query, targetPage, USDA_PAGE_SIZE)),
  );
  const offResults = await Promise.allSettled(
    pageNumbers.map((targetPage) => searchOFF(query, targetPage, OFF_PAGE_SIZE)),
  );

  const pool: FoodItem[] = [];
  const failedSources: ('usda' | 'off')[] = [];
  let usdaTotalHits = 0;
  let offTotalCount = 0;

  for (const result of usdaResults) {
    if (result.status === 'fulfilled') {
      const items = result.value.foods || [];
      if (typeof result.value.totalHits === 'number') {
        usdaTotalHits = Math.max(usdaTotalHits, result.value.totalHits);
      }
      pool.push(...items.map(normalizeUSDA));
    } else {
      failedSources.push('usda');
      console.error('USDA fetch error:', result.reason);
    }
  }

  for (const result of offResults) {
    if (result.status === 'fulfilled') {
      const items = result.value.products || [];
      if (typeof result.value.count === 'number') {
        offTotalCount = Math.max(offTotalCount, result.value.count);
      }
      pool.push(...items.map(normalizeOFF));
    } else {
      failedSources.push('off');
      console.error('OFF fetch error:', result.reason);
    }
  }

  return {
    pool: dedupeById(pool),
    failedSources,
    usdaTotalHits,
    offTotalCount,
  };
}

export async function searchFoodsPaginated(
  query: string,
  page: number,
  pageSize: number,
): Promise<SearchEnvelope> {
  const session = getOrCreateSession(query);
  const safePage = Math.max(1, page);

  const { pool, failedSources, usdaTotalHits, offTotalCount } = await fetchPageWindow(query, safePage);

  session.pool = pool;
  session.ranked = mergeAndRankResults(pool, query);
  session.failedSources = failedSources;
  session.usdaTotalHits = usdaTotalHits;
  session.offTotalCount = offTotalCount;

  const totalResults = Math.min(
    Math.max(usdaTotalHits + offTotalCount, session.ranked.length),
    MAX_UPSTREAM_RESULTS,
  );

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const normalizedPage = Math.min(safePage, totalPages);
  const start = (normalizedPage - 1) * pageSize;
  const results = session.ranked.slice(start, start + pageSize);

  const bothFailed = failedSources.includes('usda') && failedSources.includes('off');
  if (bothFailed && session.ranked.length === 0) {
    throw new Error('Both USDA and OFF APIs failed');
  }

  return {
    results,
    partial: failedSources.length > 0,
    failedSources,
    pagination: {
      page: normalizedPage,
      pageSize,
      totalResults,
      totalPages,
      hasMore: normalizedPage < totalPages,
    },
  };
}

export function __clearSessionsForTesting(): void {
  sessions.clear();
}
