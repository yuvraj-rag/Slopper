import { config } from '../config';

export class UsdaApiError extends Error {
  constructor(public type: 'timeout' | 'http_error' | 'network_error', message: string, public status?: number) {
    super(message);
    this.name = 'UsdaApiError';
  }
}

export async function searchUSDA(
  query: string,
  pageNumber = 1,
  pageSize = 50,
): Promise<any> {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('api_key', config.USDA_API_KEY);
  url.searchParams.set('query', query);
  url.searchParams.set('pageNumber', String(pageNumber));
  url.searchParams.set('pageSize', String(pageSize));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UsdaApiError('http_error', `USDA API HTTP error: ${response.status}`, response.status);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof UsdaApiError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new UsdaApiError('timeout', 'USDA API timeout');
    }
    throw new UsdaApiError('network_error', `USDA API network error: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
