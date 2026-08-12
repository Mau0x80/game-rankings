interface YearFilterProps {
  minYear: number | null;
  maxYear: number | null;
  onChangeMinYear: (value: number | null) => void;
  onChangeMaxYear: (value: number | null) => void;
}

function parseYearInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function YearFilter({ minYear, maxYear, onChangeMinYear, onChangeMaxYear }: YearFilterProps) {
  return (
    <div className="year-filter">
      <label>
        Año desde:
        <input
          type="number"
          className="year-filter-input"
          value={minYear ?? ''}
          onChange={(e) => onChangeMinYear(parseYearInput(e.target.value))}
        />
      </label>
      <label>
        hasta:
        <input
          type="number"
          className="year-filter-input"
          value={maxYear ?? ''}
          onChange={(e) => onChangeMaxYear(parseYearInput(e.target.value))}
        />
      </label>
    </div>
  );
}
