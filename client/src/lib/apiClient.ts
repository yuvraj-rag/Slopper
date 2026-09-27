import type { SearchEnvelope, SearchPagination } from '../shared/types';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

const DEFAULT_PAGINATION: SearchPagination = {
  page: 1,
  pageSize: 12,
  totalResults: 0,
  totalPages: 1,
  hasMore: false,
};

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Cannot reach the server') {
    super(message);
    this.name = 'NetworkError';
  }
}

export async function search(
  query: string,
  page = 1,
  pageSize = 12,
): Promise<SearchEnvelope> {
  if (!query) {
    return { results: [], partial: false, failedSources: [], pagination: DEFAULT_PAGINATION };
  }

  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      pageSize: String(pageSize),
    });
    const response = await fetch(`${API_URL}/search?${params.toString()}`);

    if (!response.ok) {
      let data;
      try {
        data = await response.json();
      } catch {
        throw new NetworkError();
      }
      throw new ApiError(data.error || 'Server error', data.code || String(response.status));
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}
