import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{games.length} juegos</p>
      </header>
      <GameTable games={games} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
