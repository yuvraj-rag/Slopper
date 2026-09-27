import { useCompareStore } from '../store';
import type { View } from './Layout';
import { Trash2 } from 'lucide-react';

export function CompareTable() {
  const { items, removeItem } = useCompareStore();
  const format = (val: number | null) => val === null ? '-' : val.toFixed(1);

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '600px' }}>
        <thead>
          <tr>
            <th style={{ backgroundColor: 'transparent', width: '20%' }}></th>
            {items.map(item => (
              <th key={item.id} style={{ backgroundColor: 'transparent', width: `${80 / items.length}%` }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm truncate" title={item.name}>{item.name}</span>
                  <button className="btn-icon text-accent" onClick={() => removeItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-semibold text-sm">Energy (kcal)</td>
            {items.map(item => (
              <td key={item.id} className="mono">{format(item.nutrientsPer100g.energyKcal)}</td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-sm">Protein (g)</td>
            {items.map(item => (
              <td key={item.id} className="mono">{format(item.nutrientsPer100g.protein)}</td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-sm">Fat (g)</td>
            {items.map(item => (
              <td key={item.id} className="mono">{format(item.nutrientsPer100g.fat)}</td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-sm">Carbs (g)</td>
            {items.map(item => (
              <td key={item.id} className="mono">{format(item.nutrientsPer100g.carbs)}</td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-sm">Fiber (g)</td>
            {items.map(item => (
              <td key={item.id} className="mono">{format(item.nutrientsPer100g.fiber)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function CompareChart() {
  const { items } = useCompareStore();
  
  if (items.length < 2) return null;

  const nutrients = ['protein', 'carbs', 'fat'] as const;
  const colors = {
    protein: 'var(--chart-protein)',
    carbs: 'var(--chart-carbs)',
    fat: 'var(--chart-fat)'
  };

  // Find max value to scale the chart
  let maxVal = 0;
  items.forEach(item => {
    nutrients.forEach(n => {
      const v = item.nutrientsPer100g[n] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  if (maxVal === 0) maxVal = 1; // avoid division by zero

  return (
    <div className="card mt-24">
      <h3 className="font-bold mb-16">Macronutrient Comparison (per 100g)</h3>
      <div className="flex flex-col gap-24">
        {nutrients.map(nut => (
          <div key={nut}>
            <div className="font-semibold mb-8 capitalize text-sm">{nut} (g)</div>
            <div className="flex flex-col gap-4">
              {items.map(item => {
                const val = item.nutrientsPer100g[nut] || 0;
                const width = `${(val / maxVal) * 100}%`;
                return (
                  <div key={item.id} className="flex items-center gap-8">
                    <div className="w-1/4 text-xs truncate" title={item.name} style={{ width: '25%' }}>{item.name}</div>
                    <div style={{ width: '60%' }}>
                      <div 
                        style={{ 
                          height: 16, 
                          width, 
                          backgroundColor: colors[nut], 
                          borderRadius: 'var(--radius-sm)' 
                        }}
                      />
                    </div>
                    <div className="w-1/4 mono text-xs text-right" style={{ width: '15%' }}>{val.toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompareView({ setView }: { setView: (v: View) => void }) {
  const { items, clear } = useCompareStore();

  if (items.length < 2) {
    return (
      <div className="card text-center p-32">
        <p className="text-muted mb-16">Add at least two items to compare them side by side.</p>
        <button className="btn-primary" onClick={() => setView('search')}>Back to Search</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2 className="font-bold text-lg">Compare Items</h2>
        <button className="btn-outline" onClick={clear}>Clear All</button>
      </div>
      <CompareTable />
      <CompareChart />
    </div>
  );
}
