'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Eye, Pencil, Plus } from 'lucide-react';
import { DataTable, DataTableControls, TableEmpty } from '@web/components/data-table';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import {
  useDeleteTimetableProfileMutation,
  useListAllTimetableProfilesQuery,
  useSetTimetableProfileActiveMutation,
} from './timetable.api';
import { offeringTitle } from './timetable-utils';

function scopeLabel(scope: string) {
  return scope === 'ORGANIZATION'
    ? 'Entire organization'
    : scope === 'BRANCH'
      ? 'Campus override'
      : 'Class override';
}

export function TimetableAdminHome() {
  const toast = useToast();
  const { confirm } = useConfirmation();
  const { data: profiles = [], isLoading } = useListAllTimetableProfilesQuery();
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('scope');
  const [setActive] = useSetTimetableProfileActiveMutation();
  const [remove] = useDeleteTimetableProfileMutation();
  const visibleProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...profiles]
      .filter((profile) =>
        [profile.name, scopeLabel(profile.scope), String(profile.branch?.name ?? '')]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
      .sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : sort === 'status'
            ? Number(b.isActive) - Number(a.isActive)
            : a.scope.localeCompare(b.scope),
      );
  }, [profiles, search, sort]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
            Teaching day
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[-.04em]">Timetables</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The organization schedule is shared by every campus. Add a campus or class override only
            where the day genuinely differs.
          </p>
        </div>
        <Link href="/timetable/new" className="button-primary inline-flex items-center gap-2">
          <Plus size={17} /> New timing profile
        </Link>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <h2 className="font-display text-2xl">Timing profiles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            School hours, assembly, teaching periods and breaks.
          </p>
        </div>
        <DataTableControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search timing profiles"
          sortValue={sort}
          onSortChange={setSort}
          sortOptions={[
            { value: 'scope', label: 'Scope' },
            { value: 'name', label: 'Name' },
            { value: 'status', label: 'Active first' },
          ]}
        />
        <DataTable minWidth="54rem">
          <thead className="bg-muted/45 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Profile</th>
              <th>Applies to</th>
              <th>Pattern</th>
              <th>Status</th>
              <th className="px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProfiles.map((profile) => (
              <tr key={profile.id} className="border-t border-border/70">
                <td className="px-4 py-3 font-semibold">{profile.name}</td>
                <td>
                  {scopeLabel(profile.scope)}
                  {profile.branch ? ` · ${String(profile.branch.name)}` : ''}
                </td>
                <td>{profile.timetableMode === 'SAME_DAILY' ? 'Same each day' : 'Day specific'}</td>
                <td>
                  <span
                    className={profile.isActive ? 'status-badge status-active' : 'status-badge'}
                  >
                    {profile.isActive ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      className="button-secondary inline-flex items-center gap-1.5 px-3 py-2"
                      href={`/timetable/profiles/${profile.id}`}
                    >
                      <Eye size={15} /> View
                    </Link>
                    <Link
                      className="button-secondary inline-flex items-center gap-1.5 px-3 py-2"
                      href={`/timetable/profiles/${profile.id}/edit`}
                    >
                      <Pencil size={15} /> Edit
                    </Link>
                    {!profile.isActive ? (
                      <button
                        className="button-secondary px-3 py-2"
                        onClick={async () => {
                          await setActive({ profileId: profile.id, isActive: true }).unwrap();
                          toast.success('Timing profile activated.');
                        }}
                      >
                        Activate
                      </button>
                    ) : null}
                    <button
                      className="px-2 text-sm font-semibold text-destructive"
                      onClick={async () => {
                        if (
                          !(await confirm({
                            title: 'Archive timing profile?',
                            description:
                              'It will stop being available for new timetable assignments.',
                            confirmLabel: 'Archive profile',
                          }))
                        )
                          return;
                        await remove(profile.id).unwrap();
                        toast.success('Timing profile archived.');
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!visibleProfiles.length ? (
              <TableEmpty colSpan={5}>
                {isLoading ? 'Loading timing profiles…' : 'No timing profiles match this search.'}
              </TableEmpty>
            ) : null}
          </tbody>
        </DataTable>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Class timetables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a class to view its effective schedule or assign subjects and teachers.
            </p>
          </div>
          <label className="grid min-w-64 gap-1.5 text-sm font-medium">
            Campus
            <select
              className="field"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">Choose campus</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {String(branch.name)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataTable minWidth="42rem">
          <thead className="bg-muted/45 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Class / course</th>
              <th>Section</th>
              <th>Campus</th>
              <th className="px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((offering) => (
              <tr key={offering.id} className="border-t border-border/70">
                <td className="px-4 py-3 font-semibold">{offeringTitle(offering)}</td>
                <td>{String(offering.sectionName ?? 'No section')}</td>
                <td>{String(branches.find((item) => item.id === branchId)?.name ?? '')}</td>
                <td className="px-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      className="button-secondary px-3 py-2"
                      href={`/timetable/classes/${offering.id}`}
                    >
                      View
                    </Link>
                    <Link
                      className="button-primary px-3 py-2"
                      href={`/timetable/classes/${offering.id}/edit`}
                    >
                      Assign periods
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!offerings.length ? (
              <TableEmpty colSpan={4}>
                {branchId
                  ? 'No active classes or courses at this campus.'
                  : 'Choose a campus to see its classes.'}
              </TableEmpty>
            ) : null}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
