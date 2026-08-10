'use client';

import { FormEvent, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { KeyRound, Plus, UsersRound } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListRolesQuery } from '@web/features/roles/roles.api';
import {
  useCreateStaffMutation,
  useGetStaffQuery,
  useListStaffQuery,
  useResetStaffPinMutation,
  useUpdateStaffMutation,
} from '../staff.api';
import type { ApiRecord } from '@web/store/api/base-api';

type Staff = ApiRecord & {
  user?: ApiRecord & {
    roleAssignments?: Array<ApiRecord & { role?: ApiRecord; branch?: ApiRecord }>;
  };
};
const tabs = [
  { id: 'directory', label: 'Staff directory', icon: UsersRound },
  { id: 'add', label: 'Add staff', icon: Plus },
  { id: 'record', label: 'Staff record', icon: KeyRound },
] as const;

export function StaffManagement() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('directory');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const staff = useListStaffQuery();
  const selected = useGetStaffQuery(selectedId ?? skipToken);
  useEffect(() => {
    if (selectedId) setActiveTab('record');
  }, [selectedId]);
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="eyebrow">Staff management</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.05em]">
          The people who run your campus.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Create secure staff accounts, assign their campuses, and keep their kiosk PIN separate
          from their portal password.
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
  return (
    <section
      role="tabpanel"
      id="directory-panel"
      aria-labelledby="directory-tab"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-3">
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
      toast.success('Staff account created. Save the one-time credentials.');
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
  const [resetPin] = useResetStaffPinMutation();
  const toast = useToast();
  const [pin, setPin] = useState<string | null>(null);
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
    try {
      const result = await resetPin(staff.id).unwrap();
      setPin(String(result.initialPin ?? ''));
      toast.success('Kiosk PIN reset. Save it now.');
    } catch {
      toast.error('Kiosk PIN could not be reset.');
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
        <button type="button" className="button-secondary" onClick={onBack}>
          Back to directory
        </button>
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-amber-950">Attendance kiosk PIN</p>
        <p className="mt-1 text-sm text-amber-900">
          Reset only when the staff member is present; the generated PIN is shown once.
        </p>
        <button type="button" className="button-secondary mt-3" onClick={reset}>
          Reset kiosk PIN
        </button>
        {pin ? <CredentialCard credentials={{ initialPin: pin }} /> : null}
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
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-950">Save these one-time credentials now.</p>
      <div className="mt-3 grid gap-1 font-mono text-sm text-amber-950">
        {credentials.contactNumber ? <p>Contact: {credentials.contactNumber}</p> : null}
        {credentials.initialPassword ? <p>Portal password: {credentials.initialPassword}</p> : null}
        {credentials.initialPin ? <p>Kiosk PIN: {credentials.initialPin}</p> : null}
      </div>
    </div>
  );
}
