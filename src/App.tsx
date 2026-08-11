import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';
import { PlatformFilter } from './components/PlatformFilter';
import { SearchBox } from './components/SearchBox';
import { useGameFilters } from './hooks/useGameFilters';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);
  const { selectedPlatforms, setSelectedPlatforms, search, setSearch, filtered } =
    useGameFilters(games);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{filtered.length} de {games.length} juegos</p>
      </header>
      <div className="filter-bar">
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
        <SearchBox value={search} onChange={setSearch} />
      </div>
      <GameTable games={filtered} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
