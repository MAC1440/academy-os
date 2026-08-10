'use client';

import { FormEvent, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListAcademicTermsQuery } from '@web/features/settings/settings.api';
import {
  useGetAdmissionQuery,
  useListAdmissionsQuery,
  useReviewAdmissionMutation,
} from '../admissions.api';
import type { ApiRecord } from '@web/store/api/base-api';

type Admission = ApiRecord & {
  academicOffering?: ApiRecord & {
    schoolClass?: ApiRecord;
    course?: ApiRecord;
    branch?: ApiRecord;
  };
  branch?: ApiRecord;
};
const queueTabs = [
  { id: 'PENDING', label: 'Pending', icon: ClipboardList },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { id: 'REJECTED', label: 'Rejected', icon: XCircle },
] as const;

export function AdmissionsManagement() {
  const [status, setStatus] = useState<(typeof queueTabs)[number]['id']>('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const admissions = useListAdmissionsQuery({ status });
  const selected = useGetAdmissionQuery(selectedId ?? skipToken);
  useEffect(() => {
    setSelectedId(null);
  }, [status]);
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="eyebrow">Admissions operations</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.05em]">
          Move each application with care.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Review the submitted details, verify physical documents at the campus, then approve into a
          term and offering or record a clear rejection note.
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
              id={`${id.toLowerCase()}-tab`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id.toLowerCase()}-panel`}
              onClick={() => setStatus(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,.8fr)_minmax(0,1.2fr)]">
        <section
          role="tabpanel"
          id={`${status.toLowerCase()}-panel`}
          aria-labelledby={`${status.toLowerCase()}-tab`}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="px-2 text-sm font-semibold">
            {status[0]}
            {status.slice(1).toLowerCase()} applications
          </p>
          <div className="mt-3 grid gap-2">
            {admissions.isLoading ? (
              <p className="px-2 text-sm text-muted-foreground">Loading applications...</p>
            ) : null}
            {!admissions.isLoading && (admissions.data?.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No {status.toLowerCase()} applications.
              </p>
            ) : null}
            {(admissions.data ?? []).map((application) => (
              <AdmissionRow
                key={application.id}
                application={application as Admission}
                selected={selectedId === application.id}
                onOpen={() => setSelectedId(application.id)}
              />
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <AdmissionDetail
            application={selected.data as Admission | undefined}
            isLoading={selected.isLoading}
          />
        </section>
      </div>
    </div>
  );
}

function AdmissionRow({
  application,
  selected,
  onOpen,
}: {
  application: Admission;
  selected: boolean;
  onOpen: () => void;
}) {
  const offering = String(
    application.academicOffering?.schoolClass?.name ??
      application.academicOffering?.course?.name ??
      'Offering',
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${selected ? 'border-teal-500 bg-teal-50' : 'border-border hover:border-teal-300 hover:bg-muted/40'}`}
    >
      <p className="font-medium">{String(application.studentFullName)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {offering} · {String(application.guardianContactNumber)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Submitted {String(application.createdAt).slice(0, 10)}
      </p>
    </button>
  );
}

function AdmissionDetail({
  application,
  isLoading,
}: {
  application?: Admission;
  isLoading: boolean;
}) {
  const [view, setView] = useState<'application' | 'decision'>('application');
  useEffect(() => {
    setView('application');
  }, [application?.id]);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading application...</p>;
  if (!application)
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">Choose an application.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Its submitted information and review controls will appear here.
        </p>
      </div>
    );
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Admission application</p>
        <h2 className="mt-2 font-display text-3xl tracking-[-.04em]">
          {String(application.studentFullName)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {String(application.studentCnic)} · Submitted {String(application.createdAt).slice(0, 10)}
        </p>
      </div>
      <div
        role="tablist"
        aria-label="Application detail"
        className="flex gap-2 border-b border-border pb-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'application'}
          onClick={() => setView('application')}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === 'application' ? 'bg-teal-50 text-teal-800' : 'text-muted-foreground'}`}
        >
          Application
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'decision'}
          onClick={() => setView('decision')}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === 'decision' ? 'bg-teal-50 text-teal-800' : 'text-muted-foreground'}`}
        >
          Decision
        </button>
      </div>
      {view === 'application' ? (
        <ApplicationData application={application} />
      ) : (
        <DecisionPanel application={application} />
      )}
    </div>
  );
}

function ApplicationData({ application }: { application: Admission }) {
  const fields: Array<[string, unknown]> = [
    ['Student', application.studentFullName],
    ['Student CNIC', application.studentCnic],
    ['Guardian', application.guardianFullName],
    ['Guardian contact', application.guardianContactNumber],
    ['Previous school', application.previousSchool ?? 'Not provided'],
    ['Previous performance', application.previousPerformance ?? 'Not provided'],
  ];
  return (
    <div role="tabpanel" className="grid gap-3 md:grid-cols-2">
      {fields.map(([label, value]) => (
        <article key={label} className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-sm font-medium leading-6">{String(value)}</p>
        </article>
      ))}
    </div>
  );
}

function DecisionPanel({ application }: { application: Admission }) {
  if (String(application.status) !== 'PENDING')
    return (
      <div role="tabpanel" className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="font-semibold">
          This application is {String(application.status).toLowerCase()}.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Review note: {String(application.reviewNote ?? 'None')}
        </p>
      </div>
    );
  return <ReviewForm application={application} />;
}

function ReviewForm({ application }: { application: Admission }) {
  const { data: terms = [] } = useListAcademicTermsQuery();
  const branchId = String(application.branchId ?? application.branch?.id ?? '');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [review] = useReviewAdmissionMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    status: 'APPROVED' as 'APPROVED' | 'REJECTED',
    academicOfferingId: String(application.academicOfferingId ?? ''),
    academicTermId: '',
    monthlyFeeAmount: '',
    amountReceivedWithForm: '',
    openingBalanceAmount: '',
    receiptNumber: '',
    balanceDueOn: '',
    reviewNote: '',
    physicalDocumentsVerified: false,
    physicalDocumentsVerificationNote: '',
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    const numeric = (value: string) => (value === '' ? undefined : Number(value));
    const body =
      form.status === 'REJECTED'
        ? { status: form.status, reviewNote: form.reviewNote }
        : {
            status: form.status,
            academicOfferingId: form.academicOfferingId || undefined,
            academicTermId: form.academicTermId || undefined,
            reviewNote: form.reviewNote || undefined,
            monthlyFeeAmount: numeric(form.monthlyFeeAmount),
            amountReceivedWithForm: numeric(form.amountReceivedWithForm),
            openingBalanceAmount: numeric(form.openingBalanceAmount),
            receiptNumber: form.receiptNumber || undefined,
            balanceDueOn: form.balanceDueOn || undefined,
            physicalDocumentsVerified: form.physicalDocumentsVerified,
            physicalDocumentsVerificationNote: form.physicalDocumentsVerificationNote || undefined,
          };
    try {
      await review({ id: application.id, body }).unwrap();
      toast.success(
        form.status === 'APPROVED'
          ? 'Application approved and student record created.'
          : 'Application rejected.',
      );
    } catch {
      toast.error('Decision could not be saved. Check all required approval fields.');
    }
  }
  return (
    <form role="tabpanel" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium md:col-span-2">
        Decision
        <select
          className="field"
          value={form.status}
          onChange={(event) =>
            setForm({ ...form, status: event.target.value as 'APPROVED' | 'REJECTED' })
          }
        >
          <option value="APPROVED">Approve application</option>
          <option value="REJECTED">Reject application</option>
        </select>
      </label>
      {form.status === 'APPROVED' ? (
        <>
          <label className="grid gap-1 text-sm font-medium">
            Academic term
            <select
              className="field"
              required
              value={form.academicTermId}
              onChange={(event) => setForm({ ...form, academicTermId: event.target.value })}
            >
              <option value="">Select a term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {String(term.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Campus offering
            <select
              className="field"
              required
              value={form.academicOfferingId}
              onChange={(event) => setForm({ ...form, academicOfferingId: event.target.value })}
            >
              <option value="">Select an offering</option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {String(
                    (offering.schoolClass as ApiRecord | undefined)?.name ??
                      (offering.course as ApiRecord | undefined)?.name ??
                      offering.id,
                  )}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Monthly fee (PKR)
            <input
              className="field"
              type="number"
              min="0"
              value={form.monthlyFeeAmount}
              onChange={(event) => setForm({ ...form, monthlyFeeAmount: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Received with form (PKR)
            <input
              className="field"
              type="number"
              min="0"
              value={form.amountReceivedWithForm}
              onChange={(event) => setForm({ ...form, amountReceivedWithForm: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Opening balance (PKR)
            <input
              className="field"
              type="number"
              min="0"
              value={form.openingBalanceAmount}
              onChange={(event) => setForm({ ...form, openingBalanceAmount: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Receipt number
            <input
              className="field"
              value={form.receiptNumber}
              onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Balance due on
            <input
              className="field"
              type="date"
              value={form.balanceDueOn}
              onChange={(event) => setForm({ ...form, balanceDueOn: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-medium">
            <input
              type="checkbox"
              checked={form.physicalDocumentsVerified}
              onChange={(event) =>
                setForm({ ...form, physicalDocumentsVerified: event.target.checked })
              }
            />
            Physical documents verified
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Document verification note
            <input
              className="field"
              value={form.physicalDocumentsVerificationNote}
              onChange={(event) =>
                setForm({ ...form, physicalDocumentsVerificationNote: event.target.value })
              }
            />
          </label>
        </>
      ) : null}
      <label className="grid gap-1 text-sm font-medium md:col-span-2">
        {form.status === 'REJECTED' ? 'Reason for rejection' : 'Admission note'}
        <textarea
          className="field min-h-24"
          required={form.status === 'REJECTED'}
          value={form.reviewNote}
          onChange={(event) => setForm({ ...form, reviewNote: event.target.value })}
        />
      </label>
      <button
        className={form.status === 'REJECTED' ? 'button-secondary w-fit' : 'button-primary w-fit'}
      >
        {form.status === 'APPROVED' ? 'Approve and create student' : 'Reject application'}
      </button>
    </form>
  );
}
