import { loadGames } from './data/loadGames';

const games = loadGames();

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Game Rankings</h1>
      <p>{games.length} juegos cargados.</p>
    </div>
  );
}
