'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Building2, CalendarRange, Hash, Landmark } from 'lucide-react';
import { useGetOrganizationQuery } from '../organization.api';
import {
  useCreateAcademicTermMutation,
  useGetAdmissionRegistrationSettingsQuery,
  useListAcademicTermsQuery,
  useUpdateAcademicTermMutation,
  useUpdateAdmissionRegistrationSettingsMutation,
} from '@web/features/settings/settings.api';
import { BranchPanel } from './branch-panel';
import { OrganizationProfileForm } from './organization-profile-form';
import { useToast } from '@web/components/toast-provider';
import type { Organization } from './types';
function Section({
  icon: Icon,
  title,
  detail,
  children,
}: {
  icon: typeof Building2;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="font-display text-2xl tracking-[-.035em]">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function AcademicTerms() {
  const { data: terms = [] } = useListAcademicTermsQuery();
  const [create, { isLoading }] = useCreateAcademicTermMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    termType: 'YEARLY' as 'YEARLY' | 'SEMESTER',
    startsOn: '',
    endsOn: '',
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create(form).unwrap();
      setForm({ name: '', termType: 'YEARLY', startsOn: '', endsOn: '' });
      toast.success('Academic term added.');
    } catch {
      toast.error('Academic term could not be added. Check the dates and try again.');
    }
  }
  return (
    <>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Term name
          <input
            className="field"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Academic Year 2026–27"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Term type
          <select
            className="field"
            value={form.termType}
            onChange={(event) =>
              setForm({ ...form, termType: event.target.value as 'YEARLY' | 'SEMESTER' })
            }
          >
            <option value="YEARLY">Yearly</option>
            <option value="SEMESTER">Semester</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Starts on
          <input
            className="field"
            required
            type="date"
            value={form.startsOn}
            onChange={(event) => setForm({ ...form, startsOn: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Ends on
          <input
            className="field"
            required
            type="date"
            value={form.endsOn}
            onChange={(event) => setForm({ ...form, endsOn: event.target.value })}
          />
        </label>
        <button className="button-primary w-fit" disabled={isLoading}>
          {isLoading ? 'Adding…' : 'Add academic term'}
        </button>
      </form>
      {terms.length > 0 ? (
        <div className="mt-5 space-y-3">
          {terms.map((term) => (
            <AcademicTermEditor key={term.id} term={term} />
          ))}
        </div>
      ) : null}
    </>
  );
}
function AcademicTermEditor({ term }: { term: Record<string, unknown> & { id: string } }) {
  const [update, { isLoading }] = useUpdateAcademicTermMutation();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: String(term.name ?? ''),
    termType: String(term.termType ?? 'YEARLY') as 'YEARLY' | 'SEMESTER',
    startsOn: String(term.startsOn ?? '').slice(0, 10),
    endsOn: String(term.endsOn ?? '').slice(0, 10),
  });
  function cancel() {
    setForm({
      name: String(term.name ?? ''),
      termType: String(term.termType ?? 'YEARLY') as 'YEARLY' | 'SEMESTER',
      startsOn: String(term.startsOn ?? '').slice(0, 10),
      endsOn: String(term.endsOn ?? '').slice(0, 10),
    });
    setEditing(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update({ termId: term.id, body: form }).unwrap();
      toast.success('Academic term updated.');
      setEditing(false);
    } catch {
      toast.error('Academic term could not be updated. Check the dates and try again.');
    }
  }
  if (!editing)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-teal-50/60 px-4 py-3">
        <div>
          <p className="font-medium text-foreground">{form.name}</p>
          <p className="text-sm text-muted-foreground">
            {form.termType === 'YEARLY' ? 'Yearly' : 'Semester'} · {form.startsOn} to {form.endsOn}
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="button-secondary">
          Edit
        </button>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-2"
    >
      <label className="grid gap-1 text-sm font-medium">
        Term name
        <input
          className="field"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Term type
        <select
          className="field"
          value={form.termType}
          onChange={(event) =>
            setForm({ ...form, termType: event.target.value as 'YEARLY' | 'SEMESTER' })
          }
        >
          <option value="YEARLY">Yearly</option>
          <option value="SEMESTER">Semester</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Starts on
        <input
          className="field"
          required
          type="date"
          value={form.startsOn}
          onChange={(event) => setForm({ ...form, startsOn: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Ends on
        <input
          className="field"
          required
          type="date"
          value={form.endsOn}
          onChange={(event) => setForm({ ...form, endsOn: event.target.value })}
        />
      </label>
      <div className="flex gap-2">
        <button className="button-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save term'}
        </button>
        <button type="button" onClick={cancel} className="button-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
function RegistrationNumbering() {
  const { data } = useGetAdmissionRegistrationSettingsQuery();
  const [update, { isLoading }] = useUpdateAdmissionRegistrationSettingsMutation();
  const toast = useToast();
  const [form, setForm] = useState({ prefix: '', sequencePadding: 4, nextSequence: 1 });
  useEffect(() => {
    if (data)
      setForm({
        prefix: String(data.prefix ?? ''),
        sequencePadding: Number(data.sequencePadding ?? 4),
        nextSequence: Number(data.nextSequence ?? 1),
      });
  }, [data]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update(form).unwrap();
      toast.success('Admission numbering saved.');
    } catch {
      toast.error('Admission numbering could not be saved.');
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
      <label className="grid gap-1 text-sm font-medium">
        Prefix
        <input
          className="field"
          value={form.prefix}
          onChange={(event) => setForm({ ...form, prefix: event.target.value })}
          placeholder="VPA"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Digits
        <select
          className="field"
          value={form.sequencePadding}
          onChange={(event) => setForm({ ...form, sequencePadding: Number(event.target.value) })}
        >
          {[3, 4, 5, 6].map((value) => (
            <option key={value} value={value}>
              {value} digits
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Next number
        <input
          className="field"
          min="1"
          type="number"
          value={form.nextSequence}
          onChange={(event) => setForm({ ...form, nextSequence: Number(event.target.value) })}
        />
      </label>
      <p className="text-sm text-muted-foreground md:col-span-2">
        Preview:{' '}
        <strong className="text-foreground">
          {form.prefix || 'ADM'}-GEN-{String(form.nextSequence).padStart(form.sequencePadding, '0')}
        </strong>
      </p>
      <button className="button-primary w-fit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save numbering'}
      </button>
    </form>
  );
}
export function OrganizationSetup() {
  const organization = useGetOrganizationQuery();
  const [activeTab, setActiveTab] = useState<'organization' | 'branches' | 'terms' | 'admissions'>(
    'organization',
  );
  const tabs = [
    { id: 'organization' as const, label: 'Organization', icon: Landmark },
    { id: 'branches' as const, label: 'Branches', icon: Building2 },
    { id: 'terms' as const, label: 'Academic terms', icon: CalendarRange },
    { id: 'admissions' as const, label: 'Admissions', icon: Hash },
  ];
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="eyebrow">Administrator setup</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.05em]">Set the foundation once.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          These details shape admissions, academic records, and the day-to-day workflow across your
          academy.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Organization settings"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${selected ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      {activeTab === 'organization' ? (
        <Section
          icon={Landmark}
          title="Organization"
          detail="The identity shown throughout your workspace."
        >
          <div role="tabpanel" id="organization-panel" aria-labelledby="organization-tab">
            <OrganizationProfileForm organization={organization.data as Organization | undefined} />
          </div>
        </Section>
      ) : null}
      {activeTab === 'branches' ? (
        <Section
          icon={Building2}
          title="Branches"
          detail="Add each physical campus with its unique address."
        >
          <div role="tabpanel" id="branches-panel" aria-labelledby="branches-tab">
            <BranchPanel />
          </div>
        </Section>
      ) : null}
      {activeTab === 'terms' ? (
        <Section
          icon={CalendarRange}
          title="Academic terms"
          detail="Terms are shared across all branches."
        >
          <div role="tabpanel" id="terms-panel" aria-labelledby="terms-tab">
            <AcademicTerms />
          </div>
        </Section>
      ) : null}
      {activeTab === 'admissions' ? (
        <Section
          icon={Hash}
          title="Admission numbering"
          detail="Set the registration format before approvals begin."
        >
          <div role="tabpanel" id="admissions-panel" aria-labelledby="admissions-tab">
            <RegistrationNumbering />
          </div>
        </Section>
      ) : null}
    </div>
  );
}
