import { PLATFORMS } from '../constants';

interface PlatformFilterProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function PlatformFilter({ selected, onChange }: PlatformFilterProps) {
  function toggle(platform: string) {
    const next = new Set(selected);
    if (next.has(platform)) {
      next.delete(platform);
    } else {
      next.add(platform);
    }
    onChange(next);
  }

  return (
    <div className="platform-filter">
      <button
        type="button"
        className={selected.size === 0 ? 'chip chip--active' : 'chip'}
        aria-pressed={selected.size === 0}
        onClick={() => onChange(new Set())}
      >
        Todas
      </button>
      {PLATFORMS.map((platform) => (
        <button
          key={platform}
          type="button"
          className={selected.has(platform) ? 'chip chip--active' : 'chip'}
          aria-pressed={selected.has(platform)}
          onClick={() => toggle(platform)}
        >
          {platform}
        </button>
      ))}
    </div>
  );
}
