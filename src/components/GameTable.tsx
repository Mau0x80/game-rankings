import { useRef } from 'react';
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

const columns = [
  columnHelper.display({
    id: 'rank',
    header: '#',
    // `info.row.index` is the row's position in the ORIGINAL unsorted data
    // (TanStack keeps Row objects' `.index` fixed at core-row-model creation
    // time — getSortedRowModel reorders the `rows` array but never touches
    // it). Using it here would silently show pre-sort positions after any
    // sort other than the coincidentally-matching default. Look up the row's
    // actual position in the current (sorted) row model instead.
    cell: (info) =>
      info.table.getRowModel().rows.findIndex((r) => r.id === info.row.id) + 1,
    size: 40,
  }),
  columnHelper.accessor('image', {
    header: '',
    enableSorting: false,
    size: 44,
    cell: (info) => (
      <img
        src={info.getValue()}
        alt=""
        loading="lazy"
        style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }}
        onError={(e) => {
          e.currentTarget.style.visibility = 'hidden';
        }}
      />
    ),
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
    cell: (info) => info.getValue().toFixed(2),
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

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  return (
    <div className="game-table-scroll" ref={parentRef}>
      <div className="game-table-head">
        {table.getHeaderGroups().map((headerGroup) => (
          <div className="game-table-row game-table-row--head" key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <div
                className="game-table-cell"
                key={header.id}
                style={{
                  width: header.getSize(),
                  cursor: header.column.getCanSort() ? 'pointer' : undefined,
                }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              className="game-table-row"
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
