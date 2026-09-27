import { config } from '../config';

export class OffApiError extends Error {
  constructor(public type: 'timeout' | 'http_error' | 'network_error', message: string, public status?: number) {
    super(message);
    this.name = 'OffApiError';
  }
}

export async function searchOFF(query: string, page = 1, pageSize = 24): Promise<any> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.UPSTREAM_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': config.OFF_USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        throw new OffApiError('http_error', `OFF API HTTP error: ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof OffApiError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }
        throw new OffApiError('timeout', 'OFF API timeout');
      }
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }
      throw new OffApiError('network_error', `OFF API network error: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new OffApiError('network_error', 'OFF API request failed after retries');
}
