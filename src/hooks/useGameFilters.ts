import { useMemo, useState } from 'react';
import type { Game } from '../types';

// Combining diacritical marks block (U+0300-U+036F), built from code points
// rather than a regex escape to avoid ambiguity with literal combining
// characters in source.
const DIACRITICS_START = String.fromCodePoint(0x0300);
const DIACRITICS_END = String.fromCodePoint(0x036f);
const DIACRITICS_RE = new RegExp('[' + DIACRITICS_START + '-' + DIACRITICS_END + ']', 'g');

// Case- and accent-insensitive comparison key, e.g. "Pokémon" and "pokemon"
// both normalize to "pokemon" so search matches regardless of diacritics.
function normalize(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase();
}

export interface GameFiltersInitial {
  platforms: string[];
  search: string;
  minReviews: number;
  minYear: number | null;
  maxYear: number | null;
}

export function useGameFilters(games: Game[], initial?: GameFiltersInitial) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    () => new Set(initial?.platforms ?? []),
  );
  const [search, setSearch] = useState(initial?.search ?? '');
  const [minReviews, setMinReviews] = useState(initial?.minReviews ?? 0);
  const [minYear, setMinYear] = useState<number | null>(initial?.minYear ?? null);
  const [maxYear, setMaxYear] = useState<number | null>(initial?.maxYear ?? null);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return games.filter((game) => {
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(game.platform)) {
        return false;
      }
      if (game.reviews < minReviews) {
        return false;
      }
      if (minYear !== null && game.year < minYear) {
        return false;
      }
      if (maxYear !== null && game.year > maxYear) {
        return false;
      }
      if (
        query &&
        !normalize(game.title).includes(query) &&
        !normalize(game.developer).includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [games, selectedPlatforms, search, minReviews, minYear, maxYear]);

  function clearFilters() {
    setSelectedPlatforms(new Set());
    setSearch('');
    setMinReviews(0);
    setMinYear(null);
    setMaxYear(null);
  }

  return {
    selectedPlatforms,
    setSelectedPlatforms,
    search,
    setSearch,
    minReviews,
    setMinReviews,
    minYear,
    setMinYear,
    maxYear,
    setMaxYear,
    filtered,
    clearFilters,
  };
}
