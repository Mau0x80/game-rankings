interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="text"
      className="search-box"
      placeholder="Buscar por título..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
