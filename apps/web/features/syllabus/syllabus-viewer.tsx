'use client';

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { SyllabusClass, SyllabusGroup } from './syllabus.api';
import { SyllabusRichText } from './syllabus-markdown';

export function SyllabusViewer({ classes }: { classes: SyllabusClass[] }) {
  const [selectedClassName, setSelectedClassName] = useState(classes[0]?.className ?? '');
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!classes.some((item) => item.className === selectedClassName))
      setSelectedClassName(classes[0]?.className ?? '');
  }, [classes, selectedClassName]);
  const selectedClass = classes.find((item) => item.className === selectedClassName);
  const query = search.trim().toLocaleLowerCase();
  const groups = useMemo(
    () =>
      (selectedClass?.groups ?? [])
        .map((group) => ({
          ...group,
          subjects: query
            ? group.subjects.filter((subject) =>
                subject.subjectName.toLocaleLowerCase().includes(query),
              )
            : group.subjects,
        }))
        .filter((group) => !query || group.subjects.length),
    [query, selectedClass],
  );

  if (!classes.length)
    return (
      <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-border text-center">
        <div className="max-w-md p-6">
          <h2 className="font-display text-2xl">No class syllabus yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Classes and their syllabus groups will appear here after an administrator adds them.
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-1" aria-label="Syllabus classes">
        <div className="flex min-w-max gap-2">
          {classes.map((item) => (
            <button
              key={item.className}
              type="button"
              className={
                item.className === selectedClassName ? 'button-primary' : 'button-secondary'
              }
              onClick={() => {
                setSelectedClassName(item.className);
                setSearch('');
              }}
            >
              {item.className}
            </button>
          ))}
        </div>
      </div>
      <label className="relative block max-w-lg">
        <span className="sr-only">Search subjects in {selectedClassName}</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          className="field pl-11"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search subjects in ${selectedClassName}`}
        />
      </label>
      {!groups.length ? (
        <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
          {query
            ? 'No subjects match your search.'
            : 'No syllabus groups have been added for this class.'}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, index) => (
            <SyllabusGroupView
              key={`${group.name}-${index}`}
              group={group}
              initiallyOpen={index === 0}
              searchQuery={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SyllabusGroupView({
  group,
  initiallyOpen,
  searchQuery,
}: {
  group: SyllabusGroup;
  initiallyOpen: boolean;
  searchQuery: string;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => {
    if (searchQuery) setOpen(true);
  }, [searchQuery]);
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group overflow-hidden rounded-2xl border border-border bg-card"
    >
      <summary className="cursor-pointer select-none px-5 py-4 font-semibold outline-none transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
        {group.name}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {group.subjects.length} {group.subjects.length === 1 ? 'subject' : 'subjects'}
        </span>
      </summary>
      <div className="divide-y divide-border border-t border-border">
        {group.subjects.map((subject, index) => (
          <article
            key={`${subject.subjectName}-${index}`}
            className="grid gap-3 px-5 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-7"
          >
            <h3 className="font-semibold text-foreground">{subject.subjectName}</h3>
            <SyllabusRichText content={subject.content} />
          </article>
        ))}
        {!group.subjects.length ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No subjects have been added.</p>
        ) : null}
      </div>
    </details>
  );
}
