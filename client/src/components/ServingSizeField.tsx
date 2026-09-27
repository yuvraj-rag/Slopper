const PRESETS: { grams: number; label: string }[] = [
  { grams: 100, label: '100g (Standard)' },
  { grams: 28, label: '28g (1 oz)' },
  { grams: 15, label: '15g (1 tbsp)' },
  { grams: 200, label: '200g' },
  { grams: 50, label: '50g' },
];

interface ServingSizeFieldProps {
  value: number;
  onChange: (grams: number) => void;
  id?: string;
}

export function ServingSizeField({ value, onChange, id }: ServingSizeFieldProps) {
  const matchedPreset = PRESETS.find((p) => p.grams === value);
  const selectValue = matchedPreset ? String(matchedPreset.grams) : 'custom';

  return (
    <div className="serving-size-field">
      <select
        id={id}
        className="serving-size-field__select"
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v !== 'custom') onChange(Number(v));
        }}
        aria-label="Serving size preset"
      >
        {PRESETS.map((p) => (
          <option key={p.grams} value={p.grams}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom amount</option>
      </select>
      <input
        type="number"
        className="serving-size-field__input mono"
        min={1}
        max={5000}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        aria-label="Serving size in grams"
      />
      <span className="serving-size-field__unit text-sm text-muted">g</span>
    </div>
  );
}
