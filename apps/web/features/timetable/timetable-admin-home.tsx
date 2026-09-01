'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowRight, Eye, Pencil, Plus, Search } from 'lucide-react';
import { DataTable, DataTableControls, TableEmpty } from '@web/components/data-table';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListStaffQuery } from '@web/features/staff/staff.api';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  useDeleteTimetableProfileMutation,
  useListAllTimetableProfilesQuery,
  useSetTimetableProfileActiveMutation,
} from './timetable.api';
import { offeringTitle } from './timetable-utils';
import { TeacherSchedulePanel } from './teacher-schedule-panel';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: profiles = [], isLoading } = useListAllTimetableProfilesQuery();
  const { data: branches = [] } = useListBranchesQuery();
  const branchId = searchParams.get('campus') ?? '';
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [offeringSearch, setOfferingSearch] = useState('');
  const teacherId = searchParams.get('teacher') ?? '';
  const { data: staff = [] } = useListStaffQuery();
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
  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const visibleOfferings = useMemo(() => {
    const query = offeringSearch.trim().toLowerCase();
    if (!query) return offerings;
    return offerings.filter((offering) =>
      [offeringTitle(offering), String(offering.sectionName ?? '')]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [offeringSearch, offerings]);
  const activeProfileCount = profiles.filter((profile) => profile.isActive).length;
  const selectedTeacher = staff.find((item) => item.id === teacherId);
  const teacherName = String(
    (selectedTeacher?.user as ApiRecord | undefined)?.fullName ?? 'Teacher',
  );

  function setSelection(key: 'campus' | 'teacher', value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ''}`, { scroll: false });
  }

  const returnTo = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-[-.04em]">Timetables</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose a campus to assign class periods, or manage the timing profiles that define each
            school day.
          </p>
        </div>
        <Link href="/timetable/new" className="button-primary inline-flex items-center gap-2">
          <Plus size={17} /> New timing profile
        </Link>
      </header>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Class timetables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assign subjects and teachers to each teaching period.
            </p>
          </div>
          <label className="grid w-full gap-1.5 text-sm font-medium sm:w-72">
            Campus
            <select
              className="field"
              value={branchId}
              onChange={(event) => {
                setSelection('campus', event.target.value);
                setOfferingSearch('');
              }}
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

        {branchId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/70 py-3">
            <p className="text-sm">
              <span className="font-semibold">
                {String(selectedBranch?.name ?? 'Selected campus')}
              </span>
              <span className="text-muted-foreground">
                {' '}
                · {offerings.length} {offerings.length === 1 ? 'class' : 'classes'}
              </span>
            </p>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Search classes</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                className="field field-with-leading-icon"
                placeholder="Search classes or sections"
                value={offeringSearch}
                onChange={(event) => setOfferingSearch(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <DataTable minWidth="42rem">
          <thead className="bg-muted/45 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th>Section</th>
              <th>Campus</th>
              <th className="px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleOfferings.map((offering) => (
              <tr key={offering.id} className="border-t border-border/70">
                <td className="px-4 py-3 font-semibold">{offeringTitle(offering)}</td>
                <td>{String(offering.sectionName ?? 'No section')}</td>
                <td>{String(selectedBranch?.name ?? '')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      className="button-secondary px-3 py-2"
                      href={`/timetable/classes/${offering.id}?returnTo=${encodeURIComponent(returnTo)}`}
                    >
                      View
                    </Link>
                    <Link
                      className="button-primary inline-flex items-center gap-1.5 px-3 py-2"
                      href={`/timetable/classes/${offering.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}
                    >
                      Assign periods <ArrowRight aria-hidden="true" size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!visibleOfferings.length ? (
              <TableEmpty colSpan={4}>
                {!branchId
                  ? 'Choose a campus to see its classes.'
                  : offerings.length
                    ? 'No classes match your search.'
                    : 'No active classes are available at this campus.'}
              </TableEmpty>
            ) : null}
          </tbody>
        </DataTable>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl">Teacher timetable</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See one teacher&apos;s full school week across their assigned classes and campuses.
            </p>
          </div>
          <label className="grid w-full gap-1.5 text-sm font-medium sm:w-80">
            Teacher
            <select
              className="field"
              value={teacherId}
              onChange={(event) => setSelection('teacher', event.target.value)}
            >
              <option value="">Choose teacher</option>
              {staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {String((item.user as ApiRecord | undefined)?.fullName ?? 'Unnamed teacher')}
                  {item.designation ? ` · ${String(item.designation)}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        {teacherId ? (
          <TeacherSchedulePanel staffProfileId={teacherId} teacherName={teacherName} />
        ) : (
          <div className="rounded-xl bg-muted/45 px-5 py-8 text-center text-sm text-muted-foreground">
            Choose a teacher to open their weekly timetable here.
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Timing profiles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define school hours, assembly, teaching periods and breaks.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{activeProfileCount} active</span> ·{' '}
            {profiles.length} total
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
    </div>
  );
}
