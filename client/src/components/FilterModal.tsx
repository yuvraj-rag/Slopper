import { useSearchStore, type NutrientsFilter } from '../store';
import { X, RotateCcw, Check } from 'lucide-react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minValue: number | '';
  maxValue: number | '';
  onMinChange: (value: number | '') => void;
  onMaxChange: (value: number | '') => void;
  unit: string;
}

function DualRangeSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  unit,
}: DualRangeSliderProps) {
  const minGap = Math.max(step, Number.EPSILON);

  const clamp = (value: number, lower: number, upper: number) =>
    Math.min(Math.max(value, lower), upper);

  const safeRange = max > min ? max - min : 1;

  const minNumeric =
    minValue === ''
      ? min
      : clamp(Number(minValue), min, max);

  const maxNumeric =
    maxValue === ''
      ? max
      : clamp(Number(maxValue), min, max);

  const left = Math.min(minNumeric, maxNumeric);
  const right = Math.max(minNumeric, maxNumeric);

  const rangeStart = ((left - min) / safeRange) * 100;
  const rangeEnd = ((right - min) / safeRange) * 100;

  const handleMinInput = (next: number) => {
    const maxLimit = maxValue === '' ? max : Number(maxValue);
    const upperLimit = Math.max(min, maxLimit - minGap);

    onMinChange(clamp(next, min, upperLimit));
  };

  const handleMaxInput = (next: number) => {
    const minLimit = minValue === '' ? min : Number(minValue);
    const lowerLimit = Math.min(max, minLimit + minGap);

    onMaxChange(clamp(next, lowerLimit, max));
  };

  return (
    <div className="dual-range-slider">
      <div className="dual-range-slider__row">
        <label className="dual-range-slider__value">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={(event) => {
              const raw = event.target.value;

              if (raw === '') {
                onMinChange('');
                return;
              }

              const numeric = Number(raw);

              if (Number.isFinite(numeric)) {
                handleMinInput(numeric);
              }
            }}
            aria-label={`Minimum ${unit}`}
          />
          <span className="dual-range-slider__unit">{unit}</span>
        </label>

        <div className="dual-range-slider__track-wrap">
          <div
            className="dual-range-slider__track"
            style={{
              background: `
                linear-gradient(
                  to right,
                  var(--border-color) 0%,
                  var(--border-color) ${rangeStart}%,
                  rgba(16, 185, 129, 0.9) ${rangeStart}%,
                  rgba(16, 185, 129, 0.9) ${rangeEnd}%,
                  var(--border-color) ${rangeEnd}%,
                  var(--border-color) 100%
                )
              `,
            }}
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minNumeric}
            onChange={(event) =>
              handleMinInput(Number(event.target.value))
            }
            className="dual-range-slider__input dual-range-slider__input--min"
            aria-label={`Minimum ${unit}`}
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxNumeric}
            onChange={(event) =>
              handleMaxInput(Number(event.target.value))
            }
            className="dual-range-slider__input dual-range-slider__input--max"
            aria-label={`Maximum ${unit}`}
          />
        </div>

        <label className="dual-range-slider__value">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={(event) => {
              const raw = event.target.value;

              if (raw === '') {
                onMaxChange('');
                return;
              }

              const numeric = Number(raw);

              if (Number.isFinite(numeric)) {
                handleMaxInput(numeric);
              }
            }}
            aria-label={`Maximum ${unit}`}
          />
          <span className="dual-range-slider__unit">{unit}</span>
        </label>
      </div>
    </div>
  );
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { filters, setFilters } = useSearchStore();

  if (!isOpen) return null;

  const handleFilterChange = (nutrient: keyof NutrientsFilter, type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? '' : Math.max(0, Number(value));
    setFilters({
      ...filters,
      [nutrient]: { ...filters[nutrient], [type]: numValue }
    });
  };

  const resetFilters = () => {
    setFilters({
      energyKcal: { min: '', max: '' },
      protein: { min: '', max: '' },
      fat: { min: '', max: '' },
      carbs: { min: '', max: '' },
      fiber: { min: '', max: '' },
    });
  };

  const nutrientLabels: Record<keyof NutrientsFilter, { label: string; unit: string; min: number; max: number }> = {
    energyKcal: { label: 'Energy', unit: 'kcal', min: 0, max: 1000 },
    protein: { label: 'Protein', unit: 'g', min: 0, max: 100 },
    fat: { label: 'Fat', unit: 'g', min: 0, max: 100 },
    carbs: { label: 'Carbs', unit: 'g', min: 0, max: 200 },
    fiber: { label: 'Fiber', unit: 'g', min: 0, max: 60 },
  };

  const nutrients = Object.keys(nutrientLabels) as (keyof NutrientsFilter)[];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--filter" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center rule-thin" style={{ padding: 'var(--sp-24)', margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          <div>
            <h3 className="font-bold text-lg">Filter Nutrients</h3>
            <p className="text-xs text-muted">Values per 100g serving</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-16" style={{ padding: 'var(--sp-24)', overflowY: 'auto', flex: 1 }}>
          {nutrients.map((nut) => (
            <div key={nut} className="filter-slider-group">
              <div className="filter-slider-group__header">
                <span className="text-sm font-semibold">{nutrientLabels[nut].label}</span>
                <span className="text-xs text-muted">({nutrientLabels[nut].unit})</span>
              </div>

              <DualRangeSlider
                min={nutrientLabels[nut].min}
                max={nutrientLabels[nut].max}
                step={nut === 'energyKcal' ? 10 : 1}
                minValue={filters[nut].min}
                maxValue={filters[nut].max}
                unit={nutrientLabels[nut].unit}
                onMinChange={(value) => handleFilterChange(nut, 'min', value === '' ? '' : String(value))}
                onMaxChange={(value) => handleFilterChange(nut, 'max', value === '' ? '' : String(value))}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-secondary" onClick={resetFilters}>
            <RotateCcw size={16} />
            Reset
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            <Check size={16} />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export function getActiveFilterCount(filters: NutrientsFilter): number {
  let count = 0;
  for (const key of Object.keys(filters) as (keyof NutrientsFilter)[]) {
    if (filters[key].min !== '') count++;
    if (filters[key].max !== '') count++;
  }
  return count;
}
