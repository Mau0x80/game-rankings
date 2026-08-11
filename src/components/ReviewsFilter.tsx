interface ReviewsFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export function ReviewsFilter({ value, onChange }: ReviewsFilterProps) {
  return (
    <label className="reviews-filter">
      Reviews mínimas:
      <input
        type="number"
        min={0}
        className="reviews-filter-input"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}
