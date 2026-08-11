import raw from './games.json';
import type { Game, RawGame } from '../types';

export function loadGames(): Game[] {
  return (raw as RawGame[]).map((g) => ({
    id: g.id,
    title: g.t,
    platform: g.p,
    year: g.y,
    avgScore: g.a,
    reviews: g.r,
    developer: g.d,
    image: g.i,
    bayesianAvg: g.b,
  }));
}
