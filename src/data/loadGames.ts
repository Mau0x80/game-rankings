import type { Game, RawGame } from '../types';

// Dynamic import so Vite splits games.json into its own chunk, fetched and
// parsed after the app shell has already painted, instead of blocking the
// main bundle's first execution.
export async function loadGames(): Promise<Game[]> {
  const { default: raw } = await import('./games.json');
  return (raw as RawGame[]).map((g) => ({
    id: g.id,
    title: g.t,
    platform: g.p,
    year: g.y,
    avgScore: g.a,
    reviews: g.r,
    developer: g.d,
    bayesianAvg: g.b,
  }));
}
