import { loadGames } from './data/loadGames';

const games = loadGames();

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{games.length} juegos</p>
      </header>
    </div>
  );
}
