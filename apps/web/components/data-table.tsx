'use client';

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function DataTable({
  children,
  minWidth = '42rem',
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-5 text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function DataTableControls({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  sortValue,
  onSortChange,
  sortOptions,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="relative min-w-60 flex-1 sm:max-w-sm">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          className="field field-with-leading-icon py-2"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        Sort
        <select
          className="field w-auto py-2"
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function DataTablePagination({
  page,
  pageCount,
  itemCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  itemCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (itemCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <label className="flex items-center gap-2">
        Rows
        <select
          className="field w-auto py-1.5"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {[10, 25, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="button-secondary inline-flex h-9 w-9 items-center justify-center p-0"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="button-secondary inline-flex h-9 w-9 items-center justify-center p-0"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
