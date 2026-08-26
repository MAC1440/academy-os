'use client';

import { Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, type ReactNode, useState } from 'react';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListAcademicTermsQuery } from '@web/features/settings/settings.api';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';
import { useGetAdmissionQuery, useReviewAdmissionMutation } from '../admissions.api';
import type { ReviewAdmissionInput } from '../admissions.types';
import { offeringName } from '../admissions.types';
import { AdmissionUnavailable, AdmissionsBackLink, apiErrorMessage } from './admission-shared';

export function AdmissionReviewScreen({ admissionId }: { admissionId: string }) {
  const admission = useGetAdmissionQuery(admissionId);
  const { data: terms = [] } = useListAcademicTermsQuery();
  const branchId = admission.data?.branchId ?? '';
  const { data: offerings = [] } = useListOfferingsQuery(branchId, { skip: !branchId });
  const [review, reviewState] = useReviewAdmissionMutation();
  const [form, setForm] = useState({
    status: 'APPROVED' as 'APPROVED' | 'REJECTED',
    academicOfferingId: '',
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
  const toast = useToast();
  const router = useRouter();

  const selectedOffering = form.academicOfferingId || admission.data?.academicOfferingId || '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.status === 'REJECTED' && !form.reviewNote.trim()) {
      toast.error('Enter a clear reason for rejecting this application.');
      return;
    }
    if (form.status === 'APPROVED') {
      if (!form.academicTermId || !selectedOffering) {
        toast.error('Choose the academic term and campus offering.');
        return;
      }
      if (Number(form.amountReceivedWithForm || 0) > 0 && !form.receiptNumber.trim()) {
        toast.error('Enter the receipt number for the amount received.');
        return;
      }
      if (Number(form.openingBalanceAmount || 0) > 0 && !form.balanceDueOn) {
        toast.error('Choose a due date for the remaining opening balance.');
        return;
      }
    }
    const numeric = (value: string) => (value === '' ? undefined : Number(value));
    const body: ReviewAdmissionInput =
      form.status === 'REJECTED'
        ? { status: 'REJECTED', reviewNote: form.reviewNote.trim() }
        : {
            status: 'APPROVED',
            academicOfferingId: selectedOffering,
            academicTermId: form.academicTermId,
            reviewNote: form.reviewNote.trim() || undefined,
            monthlyFeeAmount: numeric(form.monthlyFeeAmount),
            amountReceivedWithForm: numeric(form.amountReceivedWithForm),
            openingBalanceAmount: numeric(form.openingBalanceAmount),
            receiptNumber: form.receiptNumber.trim() || undefined,
            balanceDueOn: form.balanceDueOn || undefined,
            physicalDocumentsVerified: form.physicalDocumentsVerified,
            physicalDocumentsVerificationNote:
              form.physicalDocumentsVerificationNote.trim() || undefined,
          };
    try {
      await review({ id: admissionId, body }).unwrap();
      toast.success(
        form.status === 'APPROVED'
          ? 'Application approved and student record created.'
          : 'Application rejected.',
      );
      router.push(`/admissions/${admissionId}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The admission decision could not be saved.'));
    }
  }

  if (admission.isLoading)
    return <p className="text-sm text-muted-foreground">Loading admission…</p>;
  if (admission.isError || !admission.data)
    return <AdmissionUnavailable message="The application could not be loaded." />;
  if (admission.data.status !== 'PENDING')
    return <AdmissionUnavailable message="This application has already been reviewed." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-border pb-6">
        <AdmissionsBackLink />
        <h1 className="mt-4 font-display text-4xl tracking-[-.04em]">Review admission</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {admission.data.studentFullName} · {offeringName(admission.data)} ·{' '}
          {String(admission.data.branch?.name ?? 'Campus unavailable')}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-7">
        <label className="grid max-w-sm gap-1.5 text-sm font-medium">
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
            <section className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-2xl sm:col-span-2">Enrollment allocation</h2>
              <Field label="Academic term">
                <select
                  className="field"
                  required
                  value={form.academicTermId}
                  onChange={(event) => setForm({ ...form, academicTermId: event.target.value })}
                >
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {String(term.name)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Campus offering">
                <select
                  className="field"
                  required
                  value={selectedOffering}
                  onChange={(event) => setForm({ ...form, academicOfferingId: event.target.value })}
                >
                  <option value="">Select offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offeringLabel(offering)}
                    </option>
                  ))}
                </select>
              </Field>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-2xl sm:col-span-2">Fees and documents</h2>
              <MoneyField
                label="Monthly fee (PKR)"
                value={form.monthlyFeeAmount}
                onChange={(value) => setForm({ ...form, monthlyFeeAmount: value })}
              />
              <MoneyField
                label="Received with form (PKR)"
                value={form.amountReceivedWithForm}
                onChange={(value) => setForm({ ...form, amountReceivedWithForm: value })}
              />
              <MoneyField
                label="Opening balance (PKR)"
                value={form.openingBalanceAmount}
                onChange={(value) => setForm({ ...form, openingBalanceAmount: value })}
              />
              <Field label="Receipt number">
                <input
                  className="field"
                  required={Number(form.amountReceivedWithForm || 0) > 0}
                  maxLength={100}
                  value={form.receiptNumber}
                  onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })}
                />
              </Field>
              <Field label="Balance due on">
                <input
                  className="field"
                  type="date"
                  required={Number(form.openingBalanceAmount || 0) > 0}
                  value={form.balanceDueOn}
                  onChange={(event) => setForm({ ...form, balanceDueOn: event.target.value })}
                />
              </Field>
              <label className="flex items-center gap-2 self-end py-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.physicalDocumentsVerified}
                  onChange={(event) =>
                    setForm({ ...form, physicalDocumentsVerified: event.target.checked })
                  }
                />
                Physical documents verified
              </label>
              <Field label="Document verification note" wide>
                <input
                  className="field"
                  maxLength={500}
                  value={form.physicalDocumentsVerificationNote}
                  onChange={(event) =>
                    setForm({ ...form, physicalDocumentsVerificationNote: event.target.value })
                  }
                />
              </Field>
            </section>
          </>
        ) : null}

        <Field label={form.status === 'REJECTED' ? 'Reason for rejection' : 'Admission note'}>
          <textarea
            className="field min-h-28"
            required={form.status === 'REJECTED'}
            maxLength={500}
            value={form.reviewNote}
            onChange={(event) => setForm({ ...form, reviewNote: event.target.value })}
          />
        </Field>

        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Link href={`/admissions/${admissionId}`} className="button-secondary">
            Cancel
          </Link>
          <button
            className={
              form.status === 'REJECTED'
                ? 'button-destructive inline-flex items-center gap-2'
                : 'button-primary inline-flex items-center gap-2'
            }
            disabled={reviewState.isLoading}
          >
            <Save size={16} />
            {reviewState.isLoading
              ? 'Saving…'
              : form.status === 'APPROVED'
                ? 'Approve and create student'
                : 'Reject application'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        className="field"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function offeringLabel(offering: ApiRecord) {
  const name = String(
    (offering.schoolClass as ApiRecord | undefined)?.name ??
      (offering.course as ApiRecord | undefined)?.name ??
      'Offering',
  );
  return offering.sectionName ? `${name} · Section ${String(offering.sectionName)}` : name;
}
