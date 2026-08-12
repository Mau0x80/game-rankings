import { useEffect, useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Game } from '../types';

const columnHelper = createColumnHelper<Game>();

// Bayesian-average threshold above which a score is highlighted as
// exceptional, matching the "resaltar scores altos" intent from the design
// spec's amber accent color.
const HIGH_SCORE_THRESHOLD = 90;

const columns = [
  columnHelper.display({
    id: 'rank',
    header: '#',
    // `info.row.index` is the row's position in the ORIGINAL unsorted data
    // (TanStack keeps Row objects' `.index` fixed at core-row-model creation
    // time — getSortedRowModel reorders the `rows` array but never touches
    // it). Using it here would silently show pre-sort positions after any
    // sort other than the coincidentally-matching default. The actual rank
    // is rendered directly from `virtualRow.index` in the row-mapping loop
    // below (O(1), since that index already IS the row's position in the
    // current sorted/filtered `rows` array) instead of being computed here
    // via an O(n) findIndex scan on every render.
    size: 40,
  }),
  columnHelper.accessor('title', {
    header: 'Título',
    size: 320,
  }),
  columnHelper.accessor('platform', {
    header: 'Plataforma',
    size: 90,
    cell: (info) => <span className="platform-badge">{info.getValue()}</span>,
  }),
  columnHelper.accessor('year', {
    header: 'Año',
    size: 70,
  }),
  columnHelper.accessor('developer', {
    header: 'Desarrollador',
    size: 220,
  }),
  columnHelper.accessor('reviews', {
    header: 'Reviews',
    size: 80,
  }),
  columnHelper.accessor('bayesianAvg', {
    header: 'Score',
    size: 80,
    cell: (info) => {
      const value = info.getValue();
      const className = value >= HIGH_SCORE_THRESHOLD ? 'score score--high' : 'score';
      return <span className={className}>{value.toFixed(2)}</span>;
    },
  }),
];

interface GameTableProps {
  games: Game[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

export function GameTable({ games, sorting, onSortingChange }: GameTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: games,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
    // Row identity must track the game, not its array index. Without this,
    // TanStack falls back to using array index as row id, so when the
    // `games` array changes (filtering/searching), the same row id can
    // suddenly refer to a different game, and React would reuse that row's
    // DOM nodes (and any imperative state left on them) for the new game.
    getRowId: (game) => String(game.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Without this, TanStack's default 3-state toggle (asc -> desc -> unsorted)
    // makes a second header click clear sorting instead of flipping it back to
    // desc, since numeric columns auto-detect "desc" as their first direction.
    // Forcing a 2-state asc/desc toggle matches the brief's described behavior
    // ("clicking again flips back to descending").
    enableSortingRemoval: false,
  });

  const rows = table.getRowModel().rows;
  const totalWidth = table.getTotalSize();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  // Land back at the top of the list whenever the visible rows change
  // (a new filter/search narrowed the data, or the sort order changed) —
  // otherwise the user is left scrolled to an arbitrary offset into a
  // list that no longer matches what put them there.
  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [games, sorting]);

  return (
    <div className="game-table-scroll" ref={parentRef}>
      <div className="game-table-head" style={{ width: totalWidth }}>
        {table.getHeaderGroups().map((headerGroup) => (
          <div className="game-table-row game-table-row--head" key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sortDirection = header.column.getIsSorted();
              const toggleSort = header.column.getToggleSortingHandler();
              return (
                <div
                  className="game-table-cell"
                  key={header.id}
                  role="columnheader"
                  aria-sort={
                    sortDirection === 'asc'
                      ? 'ascending'
                      : sortDirection === 'desc'
                        ? 'descending'
                        : canSort
                          ? 'none'
                          : undefined
                  }
                  tabIndex={canSort ? 0 : undefined}
                  style={{ width: header.getSize(), cursor: canSort ? 'pointer' : undefined }}
                  onClick={toggleSort}
                  onKeyDown={(e) => {
                    if (canSort && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      toggleSort?.(e);
                    }
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ▲', desc: ' ▼' }[sortDirection as string] ?? ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="empty-state">No se encontraron juegos con estos filtros.</p>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), width: totalWidth, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isAlt = virtualRow.index % 2 === 1;
            return (
              <div
                className={isAlt ? 'game-table-row game-table-row--alt' : 'game-table-row'}
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    className="game-table-cell"
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {cell.column.id === 'rank'
                      ? virtualRow.index + 1
                      : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
