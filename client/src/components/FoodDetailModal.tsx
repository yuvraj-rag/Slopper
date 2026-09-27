import { useEffect, useState } from 'react';
import type { FoodItem } from '../shared/types';
import { useMealStore, useCompareStore } from '../store';
import { NutrientTable } from './Search';
import { MacroDonut } from './Meal';
import { ServingSizeField } from './ServingSizeField';
import { X, Plus, Scale, BarChart2 } from 'lucide-react';

interface FoodDetailModalProps {
  item: FoodItem | null;
  onClose: () => void;
}

export function FoodDetailModal({ item, onClose }: FoodDetailModalProps) {
  const [servingGrams, setServingGrams] = useState<number>(100);
  const addMeal = useMealStore((s) => s.addItem);
  const { items: compareItems, addItem: addCompare } = useCompareStore();

  useEffect(() => {
    if (item) setServingGrams(100);
  }, [item?.id]);

  if (!item) return null;

  const isCompareFull = compareItems.length >= 4;
  const inCompare = compareItems.some((i) => i.id === item.id);

  const scale = servingGrams / 100;
  const n = item.nutrientsPer100g;
  const scaledNutrients = {
    energyKcal: n.energyKcal !== null ? n.energyKcal * scale : null,
    protein: n.protein !== null ? n.protein * scale : null,
    fat: n.fat !== null ? n.fat * scale : null,
    carbs: n.carbs !== null ? n.carbs * scale : null,
    fiber: n.fiber !== null ? n.fiber * scale : null,
  };

  const sourceName = item.id.startsWith('usda:') ? 'USDA FoodData Central' : 'Open Food Facts';

  const handleAddToMeal = () => {
    addMeal(item, servingGrams);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div
          className="flex justify-between items-start mb-16 pb-8"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="min-w-0 pr-8">
            <div className="flex items-center gap-8 mb-4">
              <span className="text-xs font-semibold px-8 py-2 badge-subtle">{sourceName}</span>
            </div>
            <h2 className="font-bold text-xl">{item.name}</h2>
            {item.brand && <p className="text-sm text-muted">{item.brand}</p>}
          </div>
          <button type="button" className="btn-icon flex-shrink-0" onClick={onClose} aria-label="Close detail modal">
            <X size={20} />
          </button>
        </div>

        {item.imageUrl && (
          <div className="food-card__media mb-16" style={{ borderRadius: 'var(--radius-md)' }}>
            <img src={item.imageUrl} alt="" loading="lazy" />
          </div>
        )}

        <div className="serving-size-panel">
          <div className="flex items-center gap-8 text-sm font-semibold flex-shrink-0">
            <Scale size={18} className="text-accent" />
            <span>Serving size</span>
          </div>
          <ServingSizeField value={servingGrams} onChange={setServingGrams} />
        </div>

        <div className="flex flex-col md:flex-row gap-16 mb-24 items-stretch">
          <div className="w-full md:w-1/2 min-w-0">
            <h4 className="font-semibold text-sm mb-8 text-muted uppercase tracking-wider">
              Nutrients ({servingGrams}g)
            </h4>
            <NutrientTable nutrients={scaledNutrients} />
          </div>

          <div className="w-full md:w-1/2 flex flex-col items-center min-w-0">
            <h4 className="font-semibold text-sm mb-8 text-muted uppercase tracking-wider">
              Macro split
            </h4>
            <MacroDonut
              protein={scaledNutrients.protein || 0}
              carbs={scaledNutrients.carbs || 0}
              fat={scaledNutrients.fat || 0}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap gap-12 pt-16"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button type="button" className="btn-primary flex-1" style={{ minWidth: '10rem' }} onClick={handleAddToMeal}>
            <Plus size={18} />
            Add to Meal ({servingGrams}g)
          </button>
          <button
            type="button"
            className="btn-outline flex-shrink-0"
            onClick={() => addCompare(item)}
            disabled={inCompare || (isCompareFull && !inCompare)}
          >
            <BarChart2 size={18} />
            {inCompare ? 'In Compare' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}
