import { useMealStore } from '../store';
import { NutrientTable } from './Search';
import { ServingSizeField } from './ServingSizeField';
import { Trash2 } from 'lucide-react';
import type { View } from './Layout';

export function MealList({ setView }: { setView: (v: View) => void }) {
  const { items, updateQuantity, removeItem } = useMealStore();

  if (items.length === 0) {
    return (
      <div className="card text-center p-32">
        <p className="text-muted mb-16">Your meal is empty.</p>
        <button className="btn-primary" onClick={() => setView('search')}>Back to Search</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 mb-24">
      {items.map(item => (
        <div key={item.food.id} className="card flex flex-col gap-12">
          <div className="meal-item-card__header">
            <h3 className="font-bold truncate" title={item.food.name}>{item.food.name}</h3>
            <button type="button" className="btn-icon text-accent flex-shrink-0" onClick={() => removeItem(item.food.id)} aria-label="Remove from meal">
              <Trash2 size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-8">
            <span className="font-semibold text-sm">Serving size</span>
            <ServingSizeField
              value={item.quantityGrams}
              onChange={(grams) => updateQuantity(item.food.id, grams)}
            />
          </div>
          <NutrientTable nutrients={{
            energyKcal: item.food.nutrientsPer100g.energyKcal ? (item.food.nutrientsPer100g.energyKcal * item.quantityGrams) / 100 : null,
            protein: item.food.nutrientsPer100g.protein ? (item.food.nutrientsPer100g.protein * item.quantityGrams) / 100 : null,
            fat: item.food.nutrientsPer100g.fat ? (item.food.nutrientsPer100g.fat * item.quantityGrams) / 100 : null,
            carbs: item.food.nutrientsPer100g.carbs ? (item.food.nutrientsPer100g.carbs * item.quantityGrams) / 100 : null,
            fiber: item.food.nutrientsPer100g.fiber ? (item.food.nutrientsPer100g.fiber * item.quantityGrams) / 100 : null,
          }} />
        </div>
      ))}
    </div>
  );
}

export function MacroDonut({ protein, carbs, fat }: { protein: number, carbs: number, fat: number }) {
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total === 0) return <div className="text-muted text-center p-16">No macro data</div>;

  const pPct = (proteinKcal / total) * 100;
  const cPct = (carbsKcal / total) * 100;
  const fPct = (fatKcal / total) * 100;

  return (
    <div className="flex flex-col items-center">
      <div 
        style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `conic-gradient(var(--chart-protein) 0% ${pPct}%, var(--chart-carbs) ${pPct}% ${pPct + cPct}%, var(--chart-fat) ${pPct + cPct}% 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: 'var(--bg-color)' }}></div>
      </div>
      <div className="macro-donut-legend">
        <div className="macro-donut-legend__item">
          <div style={{ width: 12, height: 12, backgroundColor: 'var(--chart-protein)', borderRadius: 'var(--radius-sm)' }} />
          <span>Pro {pPct.toFixed(0)}%</span>
        </div>
        <div className="macro-donut-legend__item">
          <div style={{ width: 12, height: 12, backgroundColor: 'var(--chart-carbs)', borderRadius: 'var(--radius-sm)' }} />
          <span>Carb {cPct.toFixed(0)}%</span>
        </div>
        <div className="macro-donut-legend__item">
          <div style={{ width: 12, height: 12, backgroundColor: 'var(--chart-fat)', borderRadius: 'var(--radius-sm)' }} />
          <span>Fat {fPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export function MealTotalsPanel() {
  const items = useMealStore(s => s.items);

  const totals = items.reduce((acc, item) => {
    const q = item.quantityGrams / 100;
    const n = item.food.nutrientsPer100g;
    return {
      energyKcal: acc.energyKcal + (n.energyKcal || 0) * q,
      protein: acc.protein + (n.protein || 0) * q,
      carbs: acc.carbs + (n.carbs || 0) * q,
      fat: acc.fat + (n.fat || 0) * q,
      fiber: acc.fiber + (n.fiber || 0) * q,
    };
  }, { energyKcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  if (items.length === 0) return null;

  return (
    <div className="card">
      <h3 className="font-bold mb-16">Meal Totals</h3>
      <div className="flex flex-col gap-16 md:flex-row md:items-start md:justify-between">
        <div className="w-full">
          <NutrientTable nutrients={totals as any} />
        </div>
        <div className="w-full">
          <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
        </div>
      </div>
    </div>
  );
}
