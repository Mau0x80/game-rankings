import type { SortingState } from '@tanstack/react-table';

export interface UrlFilterState {
  platforms: string[];
  search: string;
  minReviews: number;
  minYear: number | null;
  maxYear: number | null;
  sorting: SortingState;
}

const DEFAULT_SORTING: SortingState = [{ id: 'bayesianAvg', desc: true }];

function parseNumber(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Reads the current view (filters, search, sort) from the URL's query
// string, so a link with `?platforms=NS,PS4&q=zelda` opens directly into
// that filtered view instead of always starting from the full list.
export function parseFiltersFromUrl(search: string): UrlFilterState {
  const params = new URLSearchParams(search);

  const platformsParam = params.get('platforms');
  const platforms = platformsParam ? platformsParam.split(',').filter(Boolean) : [];

  const sortId = params.get('sort');
  const sortDesc = params.get('dir') !== 'asc';
  const sorting: SortingState = sortId ? [{ id: sortId, desc: sortDesc }] : DEFAULT_SORTING;

  return {
    platforms,
    search: params.get('q') ?? '',
    minReviews: parseNumber(params.get('minReviews')) ?? 0,
    minYear: parseNumber(params.get('minYear')),
    maxYear: parseNumber(params.get('maxYear')),
    sorting,
  };
}

// Inverse of parseFiltersFromUrl: builds the query string for the current
// view so it can be written back into the address bar. Fields at their
// default value are omitted, so a fully-cleared view collapses to a bare
// URL rather than a query string full of no-op params.
export function filtersToUrlParams(state: UrlFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.platforms.length > 0) {
    params.set('platforms', state.platforms.join(','));
  }
  if (state.search.trim() !== '') {
    params.set('q', state.search);
  }
  if (state.minReviews > 0) {
    params.set('minReviews', String(state.minReviews));
  }
  if (state.minYear !== null) {
    params.set('minYear', String(state.minYear));
  }
  if (state.maxYear !== null) {
    params.set('maxYear', String(state.maxYear));
  }

  const activeSort = state.sorting[0];
  const defaultSort = DEFAULT_SORTING[0];
  if (activeSort && (activeSort.id !== defaultSort.id || activeSort.desc !== defaultSort.desc)) {
    params.set('sort', activeSort.id);
    params.set('dir', activeSort.desc ? 'desc' : 'asc');
  }

  return params;
}
