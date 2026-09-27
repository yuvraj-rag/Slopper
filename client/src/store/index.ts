import { create } from 'zustand';
import type { FoodItem, SearchPagination } from '../shared/types';
import { search as apiSearch } from '../lib/apiClient';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error';

export interface NutrientsFilter {
  energyKcal: { min: number | ''; max: number | '' };
  protein: { min: number | ''; max: number | '' };
  fat: { min: number | ''; max: number | '' };
  carbs: { min: number | ''; max: number | '' };
  fiber: { min: number | ''; max: number | '' };
}

export type SortField = 'relevance' | 'name' | 'energyKcal' | 'protein' | 'fat' | 'carbs' | 'fiber';
export type SortDirection = 'asc' | 'desc';

const DEFAULT_PAGINATION: SearchPagination = {
  page: 1,
  pageSize: 12,
  totalResults: 0,
  totalPages: 1,
  hasMore: false,
};

interface SearchState {
  query: string;
  filters: NutrientsFilter;
  sort: { field: SortField; direction: SortDirection };
  results: FoodItem[];
  pagination: SearchPagination;
  status: SearchStatus;
  failedSources: string[];
  errorMessage: string | null;

  setQuery: (query: string) => void;
  setFilters: (filters: NutrientsFilter) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  executeSearch: (query: string, page?: number) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  clearError: () => void;
}

const initialFilters: NutrientsFilter = {
  energyKcal: { min: '', max: '' },
  protein: { min: '', max: '' },
  fat: { min: '', max: '' },
  carbs: { min: '', max: '' },
  fiber: { min: '', max: '' },
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  filters: initialFilters,
  sort: { field: 'relevance', direction: 'desc' },
  results: [],
  pagination: DEFAULT_PAGINATION,
  status: 'idle',
  failedSources: [],
  errorMessage: null,

  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),
  setSort: (field, direction) => set({ sort: { field, direction } }),

  clearError: () => set({ errorMessage: null, status: 'success' }),

  executeSearch: async (query, page = 1) => {
    if (!query.trim()) {
      set({
        status: 'idle',
        results: [],
        pagination: DEFAULT_PAGINATION,
        failedSources: [],
        errorMessage: null,
        query,
      });
      return;
    }

    set({ status: 'loading', query, errorMessage: null, pagination: { ...get().pagination, page } });

    try {
      const pageSize = get().pagination.pageSize;
      const res = await apiSearch(query, page, pageSize);
      set({
        results: res.results,
        pagination: res.pagination,
        status: res.partial ? 'partial' : 'success',
        failedSources: res.failedSources,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({
        status: 'error',
        errorMessage: message,
        results: [],
        pagination: DEFAULT_PAGINATION,
        failedSources: [],
      });
    }
  },

  setPage: async (page) => {
    const { query } = get();
    if (!query.trim()) return;
    await get().executeSearch(query, page);
  },
}));

export interface MealItem {
  food: FoodItem;
  quantityGrams: number;
}

interface MealState {
  items: MealItem[];
  addItem: (food: FoodItem, quantityGrams?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantityGrams: number) => void;
}

export const useMealStore = create<MealState>((set) => ({
  items: [],
  addItem: (food, quantityGrams = 100) => set((state) => {
    const existing = state.items.find(i => i.food.id === food.id);
    if (existing) {
      return {
        items: state.items.map(i => i.food.id === food.id ? { ...i, quantityGrams: i.quantityGrams + quantityGrams } : i)
      };
    }
    return { items: [...state.items, { food, quantityGrams }] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.food.id !== id) })),
  updateQuantity: (id, quantityGrams) => set((state) => ({
    items: state.items.map(i => i.food.id === id ? { ...i, quantityGrams } : i)
  })),
}));

interface CompareState {
  items: FoodItem[];
  addItem: (food: FoodItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  items: [],
  addItem: (food) => set((state) => {
    if (state.items.length >= 4) return state;
    if (state.items.find(i => i.id === food.id)) return state;
    return { items: [...state.items, food] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  clear: () => set({ items: [] }),
}));
