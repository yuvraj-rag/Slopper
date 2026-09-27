import { FoodItem } from '../cache';
import { rankByRelevance } from '../search/relevance';

export function mergeAndRankResults(items: FoodItem[], query: string): FoodItem[] {
  const seen = new Set<string>();
  const unique: FoodItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  return rankByRelevance(unique, query);
}

export function mergeResults(usdaResults: FoodItem[], offResults: FoodItem[]): FoodItem[] {
  return [...usdaResults, ...offResults];
}
