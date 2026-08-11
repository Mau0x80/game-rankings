import { writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1rnHawH0zI0w6wa7TIazdOpk5lIrKKyYSkH5X9GFfYYc/export?format=csv&gid=782449831';

const OUTPUT_PATH = new URL('../src/data/games.json', import.meta.url);

// Explicit column order (rather than trusting the sheet's own header row)
// because the sheet has extra, unnamed documentation columns after
// "bayesian avg" that would otherwise collide as duplicate empty headers.
const COLUMNS = [
  'id',
  'title',
  'platform',
  'year',
  'avgScore',
  'reviews',
  'developer',
  'image',
  'link',
  'gamefaqs',
  'bayesianAvg',
];

async function main() {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }
  const csvText = await res.text();

  const rows = parse(csvText, {
    columns: COLUMNS,
    from_line: 2, // skip the sheet's own header row
    relax_column_count: true, // some rows have extra documentation cells
    skip_empty_lines: true,
  });

  const games = [];
  for (const row of rows) {
    const id = Number(row.id);
    const title = (row.title ?? '').trim();
    if (!id || !title) continue; // skip blank/malformed rows

    games.push({
      id,
      t: title,
      p: (row.platform ?? '').trim(),
      y: Number(row.year) || 0,
      a: Number(row.avgScore) || 0,
      r: Number(row.reviews) || 0,
      d: (row.developer ?? '').trim(),
      i: (row.image ?? '').trim(),
      b: Number(row.bayesianAvg) || 0,
    });
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(games));
  console.log(`Wrote ${OUTPUT_PATH.pathname} with ${games.length} games.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
