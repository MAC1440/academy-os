'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, UsersRound } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useConfirmation } from '@web/components/confirmation-dialog';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListRolesQuery } from '@web/features/roles/roles.api';
import {
  useCreateStaffMutation,
  useDeleteStaffMutation,
  useGetStaffQuery,
  useGetTemporaryStaffCredentialsQuery,
  useListStaffQuery,
  useResetStaffPinMutation,
  useResetStaffPasswordMutation,
  useUpdateStaffMutation,
} from '../staff.api';
import type { ApiRecord } from '@web/store/api/base-api';

type Staff = ApiRecord & {
  user?: ApiRecord & {
    roleAssignments?: Array<ApiRecord & { role?: ApiRecord; branch?: ApiRecord }>;
  };
};
const tabs = [
  { id: 'directory', label: 'Staff', icon: UsersRound },
  { id: 'add', label: 'Add staff', icon: Plus },
] as const;

export function StaffManagement() {
  const [activeTab, setActiveTab] = useState<'directory' | 'add' | 'record'>('directory');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const staff = useListStaffQuery();
  const selected = useGetStaffQuery(selectedId ?? skipToken);
  useEffect(() => {
    if (selectedId) setActiveTab('record');
  }, [selectedId]);
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Staff</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Add staff, set their campus access, and manage their kiosk PIN.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Staff management"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-tab`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      {activeTab === 'directory' ? (
        <Directory staff={staff.data ?? []} isLoading={staff.isLoading} onOpen={setSelectedId} />
      ) : null}
      {activeTab === 'add' ? (
        <CreateStaff
          onCreated={(staffId) => {
            setSelectedId(staffId);
          }}
        />
      ) : null}
      {activeTab === 'record' ? (
        <StaffRecord
          staff={selected.data as Staff | undefined}
          isLoading={selected.isLoading}
          onBack={() => setActiveTab('directory')}
        />
      ) : null}
    </div>
  );
}

function Directory({
  staff,
  isLoading,
  onOpen,
}: {
  staff: ApiRecord[];
  isLoading: boolean;
  onOpen: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filteredStaff = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return [...staff]
      .filter((item) => {
        const profile = item as Staff;
        const user = profile.user;
        if (!term) return true;
        return [
          user?.fullName,
          user?.contactNumber,
          profile.designation,
          profile.staffType,
          user?.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => {
        const leftProfile = left as Staff;
        const rightProfile = right as Staff;
        const leftValue =
          sort === 'designation'
            ? String(leftProfile.designation ?? leftProfile.staffType ?? '')
            : String(leftProfile.user?.fullName ?? '');
        const rightValue =
          sort === 'designation'
            ? String(rightProfile.designation ?? rightProfile.staffType ?? '')
            : String(rightProfile.user?.fullName ?? '');
        const comparison = leftValue.localeCompare(rightValue, 'en');
        return sort === 'name-desc' ? -comparison : comparison;
      });
  }, [search, sort, staff]);
  const pageCount = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const paginatedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search, sort]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <section
      role="tabpanel"
      id="directory-panel"
      aria-labelledby="directory-tab"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4">
        <DataTableControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search staff, contact, or designation"
          sortValue={sort}
          onSortChange={setSort}
          sortOptions={[
            { value: 'name-asc', label: 'Name: A to Z' },
            { value: 'name-desc', label: 'Name: Z to A' },
            { value: 'designation', label: 'Designation' },
          ]}
        />
      </div>
      <DataTable minWidth="50rem">
        <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Staff member</th>
            <th className="px-4 py-3 font-semibold">Role / designation</th>
            <th className="px-4 py-3 font-semibold">Campuses</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? <TableEmpty colSpan={5}>Loading staff...</TableEmpty> : null}
          {!isLoading && filteredStaff.length === 0 ? (
            <TableEmpty colSpan={5}>
              {staff.length === 0
                ? 'No staff accounts yet. Add the first staff member from the next tab.'
                : 'No staff members match your search.'}
            </TableEmpty>
          ) : null}
          {paginatedStaff.map((item) => {
            const profile = item as Staff;
            const user = profile.user;
            const branches = (user?.roleAssignments ?? [])
              .map((assignment) => String(assignment.branch?.name ?? ''))
              .filter(Boolean)
              .join(', ');
            return (
              <tr
                key={item.id}
                className="cursor-pointer transition hover:bg-teal-50/60"
                onClick={() => onOpen(item.id)}
              >
                <td className="px-4 py-3 font-medium">
                  {String(user?.fullName ?? 'Staff member')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {String(profile.designation ?? profile.staffType ?? 'Staff')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {branches || 'No campus assigned'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {String(user?.contactNumber ?? '')}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-teal-700">
                  {String(user?.status ?? 'ACTIVE')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      <div className="mt-4">
        <DataTablePagination
          page={page}
          pageCount={pageCount}
          itemCount={filteredStaff.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      <div className="hidden">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading staff...</p> : null}
        {!isLoading && staff.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No staff accounts yet. Add the first staff member from the next tab.
          </p>
        ) : null}
        {staff.map((item) => {
          const profile = item as Staff;
          const user = profile.user;
          const branches = (user?.roleAssignments ?? [])
            .map((assignment) => String(assignment.branch?.name ?? ''))
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-teal-400 hover:bg-teal-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <div>
                <p className="font-medium">{String(user?.fullName ?? 'Staff member')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {String(profile.designation ?? profile.staffType ?? 'Staff')} ·{' '}
                  {branches || 'No campus assigned'}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>{String(user?.contactNumber ?? '')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {String(user?.status ?? 'ACTIVE')}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CreateStaff({ onCreated }: { onCreated: (staffId: string) => void }) {
  const { data: branches = [] } = useListBranchesQuery();
  const { data: roles = [] } = useListRolesQuery();
  const [create] = useCreateStaffMutation();
  const toast = useToast();
  const { confirm } = useConfirmation();
  const [credentials, setCredentials] = useState<{
    contactNumber?: string;
    initialPassword?: string;
    initialPin?: string;
  } | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    staffType: 'TEACHER',
    designation: '',
    branchIds: [] as string[],
    roleId: '',
  });
  function toggle(branchId: string) {
    setForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = (await create({
        ...form,
        email: form.email || undefined,
        designation: form.designation || undefined,
        roleId: form.roleId || undefined,
      }).unwrap()) as ApiRecord & {
        staff?: ApiRecord;
        credentials?: { contactNumber?: string; initialPassword?: string; initialPin?: string };
      };
      setCredentials(result.credentials ?? null);
      toast.success(
        'Staff account created. Temporary credentials are available from the staff record.',
      );
      if (result.staff?.id) onCreated(result.staff.id);
    } catch {
      toast.error('Staff account could not be created. Contact number must be unique.');
    }
  }
  return (
    <section
      role="tabpanel"
      id="add-panel"
      aria-labelledby="add-tab"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Full name
          <input
            className="field"
            required
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Contact number{' '}
          <span className="font-normal text-muted-foreground">(no country code)</span>
          <input
            className="field"
            required
            inputMode="numeric"
            pattern="\d{7,15}"
            value={form.contactNumber}
            onChange={(event) =>
              setForm({ ...form, contactNumber: event.target.value.replace(/\D/g, '') })
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Staff type
          <select
            className="field"
            value={form.staffType}
            onChange={(event) => setForm({ ...form, staffType: event.target.value })}
          >
            <option value="TEACHER">Teacher</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="SUPPORT">Support</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Designation
          <input
            className="field"
            value={form.designation}
            onChange={(event) => setForm({ ...form, designation: event.target.value })}
            placeholder="Mathematics Teacher"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Role <span className="font-normal text-muted-foreground">(optional)</span>
          <select
            className="field"
            value={form.roleId}
            onChange={(event) => setForm({ ...form, roleId: event.target.value })}
          >
            <option value="">Use default role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {String(role.name)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium">Assigned campuses</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => (
              <label
                key={branch.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.branchIds.includes(branch.id)}
                  onChange={() => toggle(branch.id)}
                />
                {String(branch.name)}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="button-primary w-fit" disabled={form.branchIds.length === 0}>
          Create staff account
        </button>
      </form>
      {credentials ? <CredentialCard credentials={credentials} /> : null}
    </section>
  );
}

function StaffRecord({
  staff,
  isLoading,
  onBack,
}: {
  staff?: Staff;
  isLoading: boolean;
  onBack: () => void;
}) {
  const [update] = useUpdateStaffMutation();
  const [removeStaff, { isLoading: removing }] = useDeleteStaffMutation();
  const [resetPin] = useResetStaffPinMutation();
  const [resetPassword, { isLoading: resettingPassword }] = useResetStaffPasswordMutation();
  const toast = useToast();
  const { confirm } = useConfirmation();
  const temporaryCredentials = useGetTemporaryStaffCredentialsQuery(staff?.id ?? skipToken);
  const user = staff?.user;
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    staffType: 'TEACHER',
    designation: '',
    status: 'ACTIVE',
  });
  useEffect(() => {
    if (staff && user)
      setForm({
        fullName: String(user.fullName ?? ''),
        contactNumber: String(user.contactNumber ?? ''),
        email: String(user.email ?? ''),
        staffType: String(staff.staffType ?? 'TEACHER'),
        designation: String(staff.designation ?? ''),
        status: String(user.status ?? 'ACTIVE'),
      });
  }, [staff, user]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!staff) return;
    try {
      await update({ id: staff.id, body: form }).unwrap();
      toast.success('Staff record updated.');
    } catch {
      toast.error('Staff record could not be updated.');
    }
  }
  async function reset() {
    if (!staff) return;
    if (
      !(await confirm({
        title: 'Reset kiosk PIN?',
        description: 'The current kiosk PIN will stop working immediately.',
        confirmLabel: 'Reset PIN',
      }))
    )
      return;
    try {
      await resetPin(staff.id).unwrap();
      await temporaryCredentials.refetch();
      toast.success(
        'Kiosk PIN reset. It remains available here until the staff member changes it.',
      );
    } catch {
      toast.error('Kiosk PIN could not be reset.');
    }
  }
  async function resetPortalPassword() {
    if (!staff) return;
    if (
      !(await confirm({
        title: 'Reset portal password?',
        description: 'The current staff password will stop working immediately.',
        confirmLabel: 'Reset password',
      }))
    )
      return;
    try {
      await resetPassword(staff.id).unwrap();
      await temporaryCredentials.refetch();
      toast.success(
        'Portal password reset. It remains available here until the staff member changes it.',
      );
    } catch {
      toast.error('Portal password could not be reset.');
    }
  }
  async function remove() {
    if (!staff) return;
    if (
      !(await confirm({
        title: 'Remove staff member?',
        description: `Remove ${String(user?.fullName ?? 'this staff member')}? They will no longer be able to sign in.`,
        confirmLabel: 'Remove staff member',
      }))
    ) {
      return;
    }
    try {
      await removeStaff(staff.id).unwrap();
      toast.success('Staff member removed.');
      onBack();
    } catch {
      toast.error('Staff member could not be removed.');
    }
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading staff record...</p>;
  if (!staff || !user)
    return (
      <section
        role="tabpanel"
        id="record-panel"
        aria-labelledby="record-tab"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <p className="font-medium">Choose a staff member from the directory.</p>
        <button type="button" className="button-primary mt-4" onClick={onBack}>
          Open directory
        </button>
      </section>
    );
  return (
    <section
      role="tabpanel"
      id="record-panel"
      aria-labelledby="record-tab"
      className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="eyebrow">Staff record</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-.04em]">{String(user.fullName)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button-secondary" onClick={onBack}>
            Back to directory
          </button>
          <button
            type="button"
            className="rounded-xl border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
            disabled={removing}
            onClick={remove}
          >
            {removing ? 'Removing...' : 'Remove staff'}
          </button>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Full name
          <input
            className="field"
            required
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Contact number
          <input
            className="field"
            required
            value={form.contactNumber}
            onChange={(event) =>
              setForm({ ...form, contactNumber: event.target.value.replace(/\D/g, '') })
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Designation
          <input
            className="field"
            value={form.designation}
            onChange={(event) => setForm({ ...form, designation: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Staff type
          <select
            className="field"
            value={form.staffType}
            onChange={(event) => setForm({ ...form, staffType: event.target.value })}
          >
            <option value="TEACHER">Teacher</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="SUPPORT">Support</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Account status
          <select
            className="field"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        <button className="button-primary w-fit">Save changes</button>
      </form>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="font-semibold">Attendance kiosk PIN</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reset only when the staff member is present; the generated PIN is shown once.
        </p>
        <button type="button" className="button-secondary mt-3" onClick={reset}>
          Reset kiosk PIN
        </button>
        {temporaryCredentials.data?.initialPin ? (
          <CredentialCard
            credentials={{ initialPin: String(temporaryCredentials.data.initialPin) }}
          />
        ) : null}
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="font-semibold">Portal password</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reset only when needed. The staff member will be asked to choose a new password after
          signing in.
        </p>
        <button
          type="button"
          className="button-secondary mt-3"
          disabled={resettingPassword}
          onClick={resetPortalPassword}
        >
          {resettingPassword ? 'Resetting...' : 'Reset portal password'}
        </button>
        {temporaryCredentials.data?.initialPassword ? (
          <CredentialCard
            credentials={{
              contactNumber: String(temporaryCredentials.data.contactNumber ?? ''),
              initialPassword: String(temporaryCredentials.data.initialPassword),
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function CredentialCard({
  credentials,
}: {
  credentials: { contactNumber?: string; initialPassword?: string; initialPin?: string };
}) {
  return (
    <div className="mt-5 rounded-xl border border-border bg-card p-4">
      <p className="font-semibold">Temporary credentials</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Administrators can view these until the staff member changes the matching credential.
      </p>
      <div className="mt-3 grid gap-1 font-mono text-sm">
        {credentials.contactNumber ? <p>Contact: {credentials.contactNumber}</p> : null}
        {credentials.initialPassword ? <p>Portal password: {credentials.initialPassword}</p> : null}
        {credentials.initialPin ? <p>Kiosk PIN: {credentials.initialPin}</p> : null}
      </div>
    </div>
  );
}
