type PageToken = number | 'ellipsis';

function buildPageTokens(current: number, total: number): PageToken[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const tokens: PageToken[] = [1];

  if (current > 3) {
    tokens.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (current < total - 2) {
    tokens.push('ellipsis');
  }

  tokens.push(total);
  return tokens;
}

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function SearchPagination({
  page,
  totalPages,
  totalResults,
  onPageChange,
  disabled = false,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const tokens = buildPageTokens(page, totalPages);

  return (
    <nav className="search-pagination" aria-label="Search results pages">
      <p className="search-pagination__summary text-sm text-muted">
        Page {page} of {totalPages}
        <span className="search-pagination__count"> · {totalResults.toLocaleString()} results</span>
      </p>
      <div className="search-pagination__controls">
        <button
          type="button"
          className="btn-outline search-pagination__btn"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <div className="search-pagination__pages">
          {tokens.map((token, index) =>
            token === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="search-pagination__ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={token}
                type="button"
                className={`search-pagination__page ${token === page ? 'search-pagination__page--active' : ''}`}
                disabled={disabled || token === page}
                onClick={() => onPageChange(token)}
                aria-current={token === page ? 'page' : undefined}
              >
                {token}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="btn-outline search-pagination__btn"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
