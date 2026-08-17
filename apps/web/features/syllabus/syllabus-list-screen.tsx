'use client';

import { BookOpenCheck, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import { useAppSelector } from '@web/store/hooks';
import { useDeleteSessionSyllabusMutation, useListSyllabusSessionsQuery } from './syllabus.api';

export function SyllabusListScreen() {
  const { data: sessions = [], isLoading, isError } = useListSyllabusSessionsQuery();
  const [archive] = useDeleteSessionSyllabusMutation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated-desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const isAdmin = useAppSelector((state) => state.auth.user?.accountType === 'ADMIN');
  const { confirm } = useConfirmation();
  const toast = useToast();

  const filtered = useMemo(
    () =>
      sessions
        .filter((session) =>
          session.sessionYear.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
        )
        .toSorted((left, right) => {
          if (sort === 'session') return right.sessionYear.localeCompare(left.sessionYear);
          const direction = sort === 'updated-asc' ? 1 : -1;
          return (
            direction * (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime())
          );
        }),
    [sessions, search, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function remove(id: string, year: string) {
    if (
      !(await confirm({
        title: `Archive ${year}?`,
        description:
          'The complete session syllabus will be removed from staff view. This cannot be undone.',
        confirmLabel: 'Archive session',
      }))
    )
      return;
    try {
      await archive(id).unwrap();
      toast.success('Syllabus session archived.');
    } catch {
      toast.error('The syllabus session could not be archived.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em]">Syllabus</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Browse curriculum by academic session. Open a session for a clean, formatted reading
            view.
          </p>
        </div>
        {isAdmin ? (
          <Link href="/syllabus/new" className="button-primary inline-flex items-center gap-2">
            <Plus size={16} /> New session
          </Link>
        ) : null}
      </header>
      {sessions.length ? (
        <DataTableControls
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search academic sessions"
          sortValue={sort}
          onSortChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          sortOptions={[
            { value: 'updated-desc', label: 'Recently edited' },
            { value: 'updated-asc', label: 'Oldest edited' },
            { value: 'session', label: 'Newest session' },
          ]}
        />
      ) : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading syllabus…</p> : null}
      {isError ? (
        <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          The syllabus could not be loaded. Refresh the page and try again.
        </p>
      ) : null}
      {!isLoading && !isError && !sessions.length ? (
        <div className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center py-10 text-center">
          <BookOpenCheck className="text-teal-600" size={30} />
          <h2 className="mt-4 font-display text-2xl">No syllabus sessions yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isAdmin
              ? 'Create the first session, then add its classes and subjects.'
              : 'An administrator has not published a syllabus session yet.'}
          </p>
          {isAdmin ? (
            <Link href="/syllabus/new" className="button-primary mt-5">
              Create syllabus
            </Link>
          ) : null}
        </div>
      ) : null}
      {!isLoading && !isError && sessions.length ? (
        <>
          <DataTable minWidth="44rem">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Academic session</th>
                <th className="px-4 py-3 font-semibold">Last edited</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visible.map((session) => (
                <tr key={session.id} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-4 font-semibold">
                    <Link
                      href={`/syllabus/${session.id}`}
                      className="hover:text-teal-600 hover:underline"
                    >
                      {session.sessionYear}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDate(session.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/syllabus/${session.id}`}
                        className="button-secondary inline-flex items-center gap-2 px-3 py-2"
                      >
                        <Eye size={15} /> View
                      </Link>
                      {isAdmin ? (
                        <Link
                          href={`/syllabus/${session.id}/edit`}
                          className="button-secondary inline-flex items-center gap-2 px-3 py-2"
                        >
                          <Pencil size={15} /> Edit
                        </Link>
                      ) : null}
                      {isAdmin ? (
                        <button
                          type="button"
                          className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-destructive"
                          onClick={() => void remove(session.id, session.sessionYear)}
                        >
                          <Trash2 size={15} /> Archive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <TableEmpty colSpan={3}>No sessions match that search.</TableEmpty>
              ) : null}
            </tbody>
          </DataTable>
          <DataTablePagination
            page={safePage}
            pageCount={pageCount}
            itemCount={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
