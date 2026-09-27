import { useEffect, useMemo, useState } from 'react';
import { useSearchStore, useMealStore, useCompareStore } from '../store';
import type { SortField } from '../store';
import type { FoodItem } from '../shared/types';
import { Search as SearchIcon, AlertTriangle, SlidersHorizontal, X, Plus, BarChart2, Info } from 'lucide-react';
import { FilterModal, getActiveFilterCount } from './FilterModal';
import { FoodDetailModal } from './FoodDetailModal';
import { SearchPagination } from './SearchPagination';

export function SearchBar() {
  const { query, setQuery, executeSearch, filters, sort, setSort, status } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = getActiveFilterCount(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        setQuery(localQuery);
        executeSearch(localQuery);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [localQuery, query, setQuery, executeSearch]);

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    executeSearch('');
  };

  return (
    <div className="search-section">
      <div className="card search-input-card">
        <SearchIcon className="text-muted flex-shrink-0" size={20} />
        <input
          type="search"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search foods (e.g., Apple, Chicken breast, Milk...)"
          className="text-base"
          aria-label="Search foods"
        />

        {status === 'loading' && <span className="spinner flex-shrink-0" title="Searching..." />}

        {localQuery && status !== 'loading' && (
          <button type="button" className="btn-icon flex-shrink-0" onClick={handleClear} aria-label="Clear search">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="search-toolbar">
        <button
          type="button"
          className={`btn-outline ${activeFilterCount > 0 ? 'border-accent text-accent' : ''}`}
          onClick={() => setIsFilterOpen(true)}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="badge badge-accent ml-4">{activeFilterCount}</span>
          )}
        </button>

        <div className="search-toolbar__sort text-sm">
          <span className="text-muted font-medium">Sort by</span>
          <select
            value={sort.field}
            onChange={(e) => setSort(e.target.value as SortField, sort.direction)}
            aria-label="Sort results by"
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name</option>
            <option value="energyKcal">Energy (kcal)</option>
            <option value="protein">Protein</option>
            <option value="fat">Fat</option>
            <option value="carbs">Carbs</option>
            <option value="fiber">Fiber</option>
          </select>
          {sort.field !== 'relevance' && (
            <button
              type="button"
              className="btn-outline px-8"
              onClick={() => setSort(sort.field, sort.direction === 'asc' ? 'desc' : 'asc')}
              title="Toggle sort direction"
            >
              {sort.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          )}
        </div>
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
}

export function ErrorBanner() {
  const { status, errorMessage, executeSearch, query, failedSources } = useSearchStore();

  if (status !== 'error' && status !== 'partial') return null;

  return (
    <div
      className="card mb-16 flex items-center justify-between gap-12"
      style={{
        backgroundColor: status === 'partial' ? '#fffbe6' : '#fff1f0',
        borderColor: status === 'partial' ? '#ffe58f' : '#ffccc7',
      }}
    >
      <div className="flex items-center gap-12 text-sm">
        <AlertTriangle
          size={20}
          style={{ color: status === 'partial' ? '#d48806' : '#ff4d4f', flexShrink: 0 }}
        />
        <div>
          <p className="font-semibold" style={{ color: status === 'partial' ? '#873800' : '#a8071a' }}>
            {status === 'partial' ? 'Partial Data Loaded' : 'Search Error'}
          </p>
          <p className="text-muted text-xs">
            {status === 'partial'
              ? `Note: ${failedSources.map(s => s.toUpperCase()).join(', ')} source timed out or failed to respond.`
              : errorMessage}
          </p>
        </div>
      </div>
      {status === 'error' && (
        <button className="btn-primary text-xs" onClick={() => executeSearch(query)}>
          Retry
        </button>
      )}
    </div>
  );
}

export function NutrientTable({ nutrients }: { nutrients: FoodItem['nutrientsPer100g'] }) {
  const format = (val: number | null) => (val === null ? '-' : val.toFixed(1));
  const rows: { label: string; value: string }[] = [
    { label: 'Energy', value: `${format(nutrients.energyKcal)} kcal` },
    { label: 'Protein', value: `${format(nutrients.protein)} g` },
    { label: 'Carbs', value: `${format(nutrients.carbs)} g` },
    { label: 'Fat', value: `${format(nutrients.fat)} g` },
    { label: 'Fiber', value: `${format(nutrients.fiber)} g` },
  ];

  return (
    <div className="nutrient-table">
      {rows.map((row) => (
        <div key={row.label} className="nutrient-table__row">
          <span className="nutrient-table__label">{row.label}</span>
          <span className="nutrient-table__value mono font-semibold">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FoodCard({ item, onSelect }: { item: FoodItem; onSelect: (item: FoodItem) => void }) {
  const addMeal = useMealStore((s) => s.addItem);
  const { items: compareItems, addItem: addCompare } = useCompareStore();
  
  const isCompareFull = compareItems.length >= 4;
  const inCompare = compareItems.some((i) => i.id === item.id);

  const kcal = item.nutrientsPer100g.energyKcal;
  const p = item.nutrientsPer100g.protein;
  const c = item.nutrientsPer100g.carbs;
  const f = item.nutrientsPer100g.fat;

  return (
    <article
      className="card card-interactive food-card"
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {item.imageUrl && (
        <div className="food-card__media">
          <img src={item.imageUrl} alt="" loading="lazy" />
        </div>
      )}

      <div className="food-card__body">
        <div className="food-card__meta">
          <span className="text-xs font-semibold px-6 py-2 badge-subtle flex-shrink-0">
            {item.id.startsWith('usda:') ? 'USDA' : 'OFF'}
          </span>
          {kcal !== null && (
            <span className="mono font-bold text-xs text-accent whitespace-nowrap">
              {Math.round(kcal)} kcal / 100g
            </span>
          )}
        </div>

        <h3 className="food-card__title line-clamp-2" title={item.name}>
          {item.name}
        </h3>
        {item.brand && (
          <p className="food-card__brand truncate" title={item.brand}>
            {item.brand}
          </p>
        )}

        <div className="food-card__macros">
          <span className="macro-pill macro-pill--protein">
            P: {p !== null ? `${p.toFixed(1)}g` : '-'}
          </span>
          <span className="macro-pill macro-pill--carbs">
            C: {c !== null ? `${c.toFixed(1)}g` : '-'}
          </span>
          <span className="macro-pill macro-pill--fat">
            F: {f !== null ? `${f.toFixed(1)}g` : '-'}
          </span>
        </div>
      </div>

      <div className="food-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => addMeal(item, 100)}
          title="Add 100g serving to meal"
        >
          <Plus size={14} />
          Meal
        </button>
        <button
          type="button"
          className="btn-outline text-xs flex-shrink-0"
          onClick={() => addCompare(item)}
          disabled={inCompare || (isCompareFull && !inCompare)}
          title={isCompareFull ? 'Compare limit (4 items) reached' : ''}
        >
          <BarChart2 size={14} />
          {inCompare ? 'Added' : 'Compare'}
        </button>
      </div>
    </article>
  );
}

export function ResultsList() {
  const { results, status, filters, sort, pagination, setPage } = useSearchStore();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const isLoading = status === 'loading';

  const handlePageChange = (page: number) => {
    void setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processedResults = useMemo(() => {
    const filtered = results.filter((item) => {
      const n = item.nutrientsPer100g;
      for (const key of ['energyKcal', 'protein', 'fat', 'carbs', 'fiber'] as const) {
        const val = n[key];
        const min = filters[key].min;
        const max = filters[key].max;
        if (min !== '' && (val === null || val < min)) return false;
        if (max !== '' && (val === null || val > max)) return false;
      }
      return true;
    });

    if (sort.field === 'relevance') {
      return filtered;
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort.field === 'name') {
        return sort.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      const nutrientKey = sort.field === 'relevance' ? 'energyKcal' : sort.field;
      const aVal = a.nutrientsPer100g[nutrientKey] ?? 0;
      const bVal = b.nutrientsPer100g[nutrientKey] ?? 0;
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [results, filters, sort]);

  if (status === 'loading') {
    return (
      <div className="grid-cards">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card skeleton food-card" style={{ minHeight: 140 }} />
        ))}
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="text-center text-muted p-48 card flex flex-col items-center justify-center gap-8">
        <Info size={32} className="text-muted opacity-50" />
        <p className="font-semibold text-base">Search for food items above</p>
        <p className="text-xs">Type food names like "apple", "salmon", or "oats" to explore nutrition facts.</p>
      </div>
    );
  }

  if (status === 'success' || status === 'partial') {
    if (processedResults.length === 0) {
      return (
        <div className="text-center text-muted p-48 card">
          No food items found matching your query or active filters.
        </div>
      );
    }

    return (
      <>
        <div className="grid-cards">
          {processedResults.map((item) => (
            <FoodCard key={item.id} item={item} onSelect={setSelectedFood} />
          ))}
        </div>

        <SearchPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalResults={pagination.totalResults}
          onPageChange={handlePageChange}
          disabled={isLoading}
        />

        <FoodDetailModal item={selectedFood} onClose={() => setSelectedFood(null)} />
      </>
    );
  }

  return null;
}
