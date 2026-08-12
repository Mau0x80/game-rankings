import { useEffect, useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';
import { PlatformFilter } from './components/PlatformFilter';
import { SearchBox } from './components/SearchBox';
import { ReviewsFilter } from './components/ReviewsFilter';
import { YearFilter } from './components/YearFilter';
import { useGameFilters } from './hooks/useGameFilters';
import { filtersToUrlParams, parseFiltersFromUrl } from './urlState';
import type { Game } from './types';

// Parsed once at module load, before the data even finishes fetching, so
// the initial render of every filter control already reflects a shared URL.
const initialUrlState = parseFiltersFromUrl(window.location.search);

export default function App() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [sorting, setSorting] = useState<SortingState>(initialUrlState.sorting);
  const {
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
  } = useGameFilters(games ?? [], initialUrlState);

  useEffect(() => {
    loadGames().then(setGames);
  }, []);

  // Keep the address bar in sync with the current view so it can be shared
  // or bookmarked. Uses replaceState (not pushState) so typing in the
  // search box doesn't spam the browser's back-button history.
  useEffect(() => {
    const params = filtersToUrlParams({
      platforms: [...selectedPlatforms],
      search,
      minReviews,
      minYear,
      maxYear,
      sorting,
    });
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [selectedPlatforms, search, minReviews, minYear, maxYear, sorting]);

  if (games === null) {
    return (
      <div className="app">
        <div className="app-loading">Cargando juegos…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{filtered.length} de {games.length} juegos</p>
      </header>
      <div className="filter-bar">
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
        <SearchBox value={search} onChange={setSearch} />
        <YearFilter
          minYear={minYear}
          maxYear={maxYear}
          onChangeMinYear={setMinYear}
          onChangeMaxYear={setMaxYear}
        />
        <ReviewsFilter value={minReviews} onChange={setMinReviews} />
        <button type="button" className="clear-filters-btn" onClick={clearFilters}>
          Limpiar filtros
        </button>
      </div>
      <GameTable games={filtered} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
