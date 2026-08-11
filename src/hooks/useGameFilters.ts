import { useMemo, useState } from 'react';
import type { Game } from '../types';

export function useGameFilters(games: Game[]) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [minReviews, setMinReviews] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(game.platform)) {
        return false;
      }
      if (game.reviews < minReviews) {
        return false;
      }
      if (query && !game.title.toLowerCase().includes(query)) {
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
