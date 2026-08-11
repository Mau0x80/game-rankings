export interface Game {
  id: number;
  title: string;
  platform: string;
  year: number;
  avgScore: number;
  reviews: number;
  developer: string;
  image: string;
  bayesianAvg: number;
}

export interface RawGame {
  id: number;
  t: string;
  p: string;
  y: number;
  a: number;
  r: number;
  d: string;
  i: string;
  b: number;
}
