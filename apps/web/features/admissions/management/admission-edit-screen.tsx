'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';
import { useGetAdmissionQuery, useUpdateAdmissionMutation } from '../admissions.api';
import { AdmissionUnavailable, AdmissionsBackLink, apiErrorMessage } from './admission-shared';

export function AdmissionEditScreen({ admissionId }: { admissionId: string }) {
  const admission = useGetAdmissionQuery(admissionId);
  const { data: branches = [] } = useListBranchesQuery();
  const [update, updateState] = useUpdateAdmissionMutation();
  const [branchId, setBranchId] = useState('');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [form, setForm] = useState({
    academicOfferingId: '',
    studentFullName: '',
    studentCnic: '',
    guardianFullName: '',
    guardianContactNumber: '',
    previousSchool: '',
    previousPerformance: '',
  });
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!admission.data) return;
    setBranchId(admission.data.branchId);
    setForm({
      academicOfferingId: admission.data.academicOfferingId,
      studentFullName: admission.data.studentFullName,
      studentCnic: admission.data.studentCnic,
      guardianFullName: admission.data.guardianFullName,
      guardianContactNumber: admission.data.guardianContactNumber,
      previousSchool: admission.data.previousSchool ?? '',
      previousPerformance: admission.data.previousPerformance ?? '',
    });
  }, [admission.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.studentFullName.trim() || !form.guardianFullName.trim()) {
      toast.error('Student and guardian names cannot be empty.');
      return;
    }
    try {
      await update({
        id: admissionId,
        body: {
          ...form,
          studentFullName: form.studentFullName.trim(),
          guardianFullName: form.guardianFullName.trim(),
          previousSchool: form.previousSchool.trim() || undefined,
          previousPerformance: form.previousPerformance.trim() || undefined,
        },
      }).unwrap();
      toast.success('Admission application updated.');
      router.push(`/admissions/${admissionId}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The application could not be updated.'));
    }
  }

  if (admission.isLoading)
    return <p className="text-sm text-muted-foreground">Loading admission…</p>;
  if (admission.isError || !admission.data)
    return <AdmissionUnavailable message="The application could not be loaded." />;
  if (admission.data.status !== 'PENDING')
    return <AdmissionUnavailable message="Only pending applications can be edited." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-border pb-6">
        <AdmissionsBackLink />
        <h1 className="mt-4 font-display text-4xl tracking-[-.04em]">Edit admission</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Correct the submitted information before making a decision. Approval details and fees are
          recorded separately during review.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-7">
        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="font-display text-2xl sm:col-span-2">Student and guardian</h2>
          <Field label="Student full name">
            <input
              className="field"
              required
              maxLength={160}
              value={form.studentFullName}
              onChange={(event) => setForm({ ...form, studentFullName: event.target.value })}
            />
          </Field>
          <Field label="Student CNIC / B-Form">
            <input
              className="field"
              required
              inputMode="numeric"
              minLength={13}
              maxLength={13}
              pattern="\d{13}"
              value={form.studentCnic}
              onChange={(event) =>
                setForm({ ...form, studentCnic: event.target.value.replace(/\D/g, '') })
              }
            />
          </Field>
          <Field label="Guardian full name">
            <input
              className="field"
              required
              maxLength={160}
              value={form.guardianFullName}
              onChange={(event) => setForm({ ...form, guardianFullName: event.target.value })}
            />
          </Field>
          <Field label="Guardian contact number">
            <input
              className="field"
              required
              inputMode="tel"
              minLength={7}
              maxLength={15}
              pattern="\d{7,15}"
              value={form.guardianContactNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  guardianContactNumber: event.target.value.replace(/\D/g, ''),
                })
              }
            />
          </Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="font-display text-2xl sm:col-span-2">Campus and class</h2>
          <Field label="Campus">
            <select
              className="field"
              required
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setForm({ ...form, academicOfferingId: '' });
              }}
            >
              <option value="">Select campus</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {String(branch.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Class or course">
            <select
              className="field"
              required
              disabled={!branchId}
              value={form.academicOfferingId}
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
          <h2 className="font-display text-2xl sm:col-span-2">Previous academics</h2>
          <Field label="Previous school" optional>
            <input
              className="field"
              maxLength={300}
              value={form.previousSchool}
              onChange={(event) => setForm({ ...form, previousSchool: event.target.value })}
            />
          </Field>
          <Field label="Previous performance" optional>
            <textarea
              className="field min-h-28"
              maxLength={2000}
              value={form.previousPerformance}
              onChange={(event) => setForm({ ...form, previousPerformance: event.target.value })}
            />
          </Field>
        </section>

        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Link href={`/admissions/${admissionId}`} className="button-secondary">
            Cancel
          </Link>
          <button
            className="button-primary inline-flex items-center gap-2"
            disabled={updateState.isLoading}
          >
            <Save size={16} /> {updateState.isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label}{' '}
        {optional ? <span className="font-normal text-muted-foreground">(optional)</span> : null}
      </span>
      {children}
    </label>
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
