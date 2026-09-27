import { FoodItem } from '../cache';

function titleCaseSegment(segment: string): string {
  const lower = segment.toLowerCase();
  return lower.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

/** User-facing label; raw USDA text is kept in rawName. */
export function formatUsdaDisplayName(description: string): string {
  const parts = description.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return 'Unknown Product';

  const formatted = parts.map((part) => {
    const isAllCaps = part === part.toUpperCase() && /[A-Z]/.test(part);
    return isAllCaps ? titleCaseSegment(part) : part;
  });

  if (formatted.length > 4) {
    return formatted.slice(0, 3).join(', ');
  }
  return formatted.join(', ');
}

const USDA_NUTRIENT_IDS = {
  energyKcal: [1008, 2047],
  protein: [1003],
  fat: [1004],
  carbs: [1005],
  fiber: [1079],
};

function getNutrient(foodNutrients: any[], ids: number[]): number | null {
  if (!foodNutrients || !Array.isArray(foodNutrients)) return null;
  const nutrient = foodNutrients.find(n => ids.includes(n.nutrientId) || (n.nutrient && ids.includes(n.nutrient.id)));
  if (!nutrient) return null;
  const value = nutrient.value ?? nutrient.amount;
  return typeof value === 'number' ? value : null;
}

export function normalizeUSDA(raw: any): FoodItem {
  const rawDescription = raw.description || 'Unknown Product';
  return {
    id: `usda:${raw.fdcId}`,
    rawName: rawDescription,
    name: formatUsdaDisplayName(rawDescription),
    brand: raw.brandOwner || undefined,
    imageUrl: undefined,
    nutrientsPer100g: {
      energyKcal: getNutrient(raw.foodNutrients, USDA_NUTRIENT_IDS.energyKcal),
      protein: getNutrient(raw.foodNutrients, USDA_NUTRIENT_IDS.protein),
      fat: getNutrient(raw.foodNutrients, USDA_NUTRIENT_IDS.fat),
      carbs: getNutrient(raw.foodNutrients, USDA_NUTRIENT_IDS.carbs),
      fiber: getNutrient(raw.foodNutrients, USDA_NUTRIENT_IDS.fiber),
    },
  };
}
