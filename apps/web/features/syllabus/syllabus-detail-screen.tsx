'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@web/store/hooks';
import { useGetSessionSyllabusQuery } from './syllabus.api';
import { SyllabusViewer } from './syllabus-viewer';

export function SyllabusDetailScreen({ syllabusId }: { syllabusId: string }) {
  const syllabus = useGetSessionSyllabusQuery(syllabusId);
  const isAdmin = useAppSelector((state) => state.auth.user?.accountType === 'ADMIN');
  if (syllabus.isLoading) return <p className="text-sm text-muted-foreground">Loading syllabus…</p>;
  if (syllabus.isError || !syllabus.data)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-8 text-center">
        <h1 className="font-display text-2xl">Syllabus unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been archived or you may no longer have access.
        </p>
        <Link href="/syllabus" className="button-primary mt-5 inline-flex">
          Return to syllabus
        </Link>
      </div>
    );
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <Link
          href="/syllabus"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:underline"
        >
          <ArrowLeft size={16} /> All sessions
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-[-.04em]">
              Syllabus {syllabus.data.sessionYear}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last edited {formatDate(syllabus.data.updatedAt)}
            </p>
          </div>
          {isAdmin ? (
            <Link
              href={`/syllabus/${syllabusId}/edit`}
              className="button-secondary inline-flex items-center gap-2"
            >
              <Pencil size={16} /> Edit syllabus
            </Link>
          ) : null}
        </div>
      </header>
      <SyllabusViewer classes={syllabus.data.classes} />
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
