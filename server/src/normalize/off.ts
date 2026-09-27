import { FoodItem } from '../cache';

export function normalizeOFF(raw: any): FoodItem {
  const nutriments = raw.nutriments || {};

  function getNutriment(key: string): number | null {
    const val = nutriments[`${key}_100g`];
    return typeof val === 'number' ? val : null;
  }

  const productName = raw.product_name || 'Unknown Product';
  return {
    id: `off:${raw.code || raw.id}`,
    rawName: productName,
    name: productName.trim(),
    brand: raw.brands || undefined,
    imageUrl: raw.image_url || raw.image_front_small_url || undefined,
    nutrientsPer100g: {
      energyKcal: getNutriment('energy-kcal'),
      protein: getNutriment('proteins'),
      fat: getNutriment('fat'),
      carbs: getNutriment('carbohydrates'),
      fiber: getNutriment('fiber'),
    },
  };
}
