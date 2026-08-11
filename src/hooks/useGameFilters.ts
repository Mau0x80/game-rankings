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

export function useGameFilters(games: Game[]) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [minReviews, setMinReviews] = useState(0);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return games.filter((game) => {
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(game.platform)) {
        return false;
      }
      if (game.reviews < minReviews) {
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
  }, [games, selectedPlatforms, search, minReviews]);

  function clearFilters() {
    setSelectedPlatforms(new Set());
    setSearch('');
    setMinReviews(0);
  }

  return {
    selectedPlatforms,
    setSelectedPlatforms,
    search,
    setSearch,
    minReviews,
    setMinReviews,
    filtered,
    clearFilters,
  };
}
