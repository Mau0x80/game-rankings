import type { Game, RawGame } from '../types';

function mapRawGame(g: RawGame): Game {
  return {
    id: g.id,
    title: g.t,
    platform: g.p,
    year: g.y,
    avgScore: g.a,
    reviews: g.r,
    developer: g.d,
    bayesianAvg: g.b,
  };
}

// Dynamic imports so Vite splits both files into their own chunk(s), fetched
// and parsed after the app shell has already painted, instead of blocking
// the main bundle's first execution.
//
// Two separate files rather than one: `games.json` is entirely regenerated
// by `scripts/sync-data.mjs` from the Google Sheet every time it runs, so
// anything added to it outside that process would be silently overwritten
// on the next sync. `community-games.json` is only ever touched by the
// GitHub Action in `.github/workflows/add-game.yml` (via a pull request a
// maintainer reviews and merges) — sync-data never writes to it, so
// community contributions survive future archive syncs.
export async function loadGames(): Promise<Game[]> {
  const [{ default: archive }, { default: community }] = await Promise.all([
    import('./games.json'),
    import('./community-games.json'),
  ]);
  return [...(archive as RawGame[]), ...(community as RawGame[])].map(mapRawGame);
}
