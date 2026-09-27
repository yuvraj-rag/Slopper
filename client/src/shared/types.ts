export interface FoodItem {
  id: string; // "usda:<id>" or "off:<id>"
  name: string;
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
