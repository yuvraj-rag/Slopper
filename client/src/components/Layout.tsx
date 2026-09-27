import { useMealStore } from '../store';
import { Search as SearchIcon, UtensilsCrossed, Scale, ChevronRight } from 'lucide-react';

export type View = 'search' | 'meal' | 'compare';

interface TopNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function TopNav({ currentView, onViewChange }: TopNavProps) {
  const mealItems = useMealStore((s) => s.items);
  const totalMealCount = mealItems.length;

  return (
    <header className="app-header">
      <div className="app-brand flex items-center gap-8">
        <img
          src="/favicon.svg"
          alt="Slopper logo"
          className="flex-shrink-0"
          style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }}
        />
        <div className="min-w-0">
          <h1 className="app-brand__title font-bold tracking-tight">Slopper</h1>
          <p className="text-xs text-muted">Nutrition search & comparison</p>
        </div>
      </div>

      <nav className="app-nav" aria-label="Main">
        <button
          type="button"
          onClick={() => onViewChange('search')}
          className={`btn-outline ${currentView === 'search' ? 'border-accent text-accent font-semibold' : ''}`}
        >
          <SearchIcon size={16} />
          Explore
        </button>

        <button
          type="button"
          onClick={() => onViewChange('meal')}
          className={`btn-outline ${currentView === 'meal' ? 'border-accent text-accent font-semibold' : ''}`}
        >
          <UtensilsCrossed size={16} />
          My Meal
          {totalMealCount > 0 && (
            <span className="badge badge-accent ml-4">{totalMealCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onViewChange('compare')}
          className={`btn-outline ${currentView === 'compare' ? 'border-accent text-accent font-semibold' : ''}`}
        >
          <Scale size={16} />
          Compare
        </button>
      </nav>
    </header>
  );
}

interface MealSummaryBarProps {
  onOpenMeal: () => void;
}

export function MealSummaryBar({ onOpenMeal }: MealSummaryBarProps) {
  const items = useMealStore((s) => s.items);

  const totalItems = items.length;
  const totalKcal = items.reduce((sum, item) => {
    const kcal = item.food.nutrientsPer100g.energyKcal || 0;
    return sum + (kcal * item.quantityGrams) / 100;
  }, 0);

  if (totalItems === 0) return null;

  return (
    <button
      type="button"
      className="meal-summary-bar card border-accent bg-accent-light"
      onClick={onOpenMeal}
      aria-label={`Open meal with ${totalItems} items, ${Math.round(totalKcal)} kilocalories`}
    >
      <div className="flex items-center gap-8 text-sm min-w-0">
        <UtensilsCrossed size={18} className="text-accent flex-shrink-0" />
        <span className="font-semibold text-accent">Current meal</span>
        <span className="text-muted truncate">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div className="flex items-center gap-8 flex-shrink-0">
        <span className="mono font-bold text-base text-accent">{Math.round(totalKcal)} kcal</span>
        <span className="text-accent text-sm font-semibold flex items-center gap-4">
          Open
          <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
}
