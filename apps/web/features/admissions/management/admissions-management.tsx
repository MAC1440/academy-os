'use client';

import { CheckCircle2, ClipboardList, Eye, Pencil, Scale, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import { useListAdmissionsQuery } from '../admissions.api';
import { type AdmissionStatus, offeringName } from '../admissions.types';

const queueTabs = [
  { id: 'PENDING', label: 'Pending', icon: ClipboardList },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { id: 'REJECTED', label: 'Rejected', icon: XCircle },
] as const satisfies ReadonlyArray<{
  id: AdmissionStatus;
  label: string;
  icon: typeof ClipboardList;
}>;

export function AdmissionsManagement() {
  const [status, setStatus] = useState<AdmissionStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const admissions = useListAdmissionsQuery({ status });
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...(admissions.data ?? [])]
      .filter((application) =>
        `${application.studentFullName} ${application.studentCnic} ${application.guardianFullName} ${application.guardianContactNumber} ${offeringName(application)} ${String(application.branch?.name ?? '')}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .toSorted((left, right) =>
        sort === 'name'
          ? left.studentFullName.localeCompare(right.studentFullName)
          : right.createdAt.localeCompare(left.createdAt),
      );
  }, [admissions.data, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [status, search, sort, pageSize]);

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="font-display text-4xl tracking-[-.04em]">Admissions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review applications, correct submitted details, and record a clear decision without losing
          the original admission history.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Admission queue"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {queueTabs.map(({ id, label, icon: Icon }) => {
          const active = status === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      <DataTableControls
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student, CNIC, guardian, class, or campus"
        sortValue={sort}
        onSortChange={setSort}
        sortOptions={[
          { value: 'newest', label: 'Newest first' },
          { value: 'name', label: 'Student A–Z' },
        ]}
      />

      <DataTable minWidth="62rem">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Student</th>
            <th className="px-4 py-3 font-semibold">Class / course</th>
            <th className="px-4 py-3 font-semibold">Campus</th>
            <th className="px-4 py-3 font-semibold">Guardian</th>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {admissions.isLoading ? <TableEmpty colSpan={6}>Loading applications…</TableEmpty> : null}
          {!admissions.isLoading && !visible.length ? (
            <TableEmpty colSpan={6}>
              {search
                ? 'No applications match this search.'
                : `No ${status.toLowerCase()} applications.`}
            </TableEmpty>
          ) : null}
          {visible.map((application) => (
            <tr key={application.id} className="transition-colors hover:bg-muted/25">
              <td className="px-4 py-4">
                <Link
                  href={`/admissions/${application.id}`}
                  className="font-semibold hover:text-teal-600 hover:underline"
                >
                  {application.studentFullName}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{application.studentCnic}</p>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{offeringName(application)}</td>
              <td className="px-4 py-4 text-muted-foreground">
                {String(application.branch?.name ?? 'Campus unavailable')}
              </td>
              <td className="px-4 py-4">
                <p>{application.guardianFullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {application.guardianContactNumber}
                </p>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatDate(application.createdAt)}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admissions/${application.id}`}
                    className="button-secondary inline-flex items-center gap-2 px-3 py-2"
                  >
                    <Eye size={15} /> View
                  </Link>
                  {application.status === 'PENDING' ? (
                    <>
                      <Link
                        href={`/admissions/${application.id}/edit`}
                        className="button-secondary inline-flex items-center gap-2 px-3 py-2"
                      >
                        <Pencil size={15} /> Edit
                      </Link>
                      <Link
                        href={`/admissions/${application.id}/review`}
                        className="button-primary inline-flex items-center gap-2 px-3 py-2"
                      >
                        <Scale size={15} /> Review
                      </Link>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <DataTablePagination
        page={safePage}
        pageCount={pageCount}
        itemCount={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
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
