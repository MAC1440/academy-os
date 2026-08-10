'use client';

import { FormEvent, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import {
  useReviewAdmissionMutation,
  useSubmitAdmissionMutation,
} from '@web/features/admissions/admissions.api';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListAcademicTermsQuery } from '@web/features/settings/settings.api';
import type { ApiRecord } from '@web/store/api/base-api';

export function DirectEnrollment({ onCreated }: { onCreated: (studentId: string) => void }) {
  const { data: branches = [] } = useListBranchesQuery();
  const { data: terms = [] } = useListAcademicTermsQuery();
  const [branchId, setBranchId] = useState('');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [submitAdmission] = useSubmitAdmissionMutation();
  const [reviewAdmission, { isLoading }] = useReviewAdmissionMutation();
  const toast = useToast();
  const [credentials, setCredentials] = useState<{
    contactNumber?: string;
    initialPassword?: string;
  } | null>(null);
  const [form, setForm] = useState({
    studentFullName: '',
    studentCnic: '',
    guardianFullName: '',
    guardianContactNumber: '',
    academicOfferingId: '',
    academicTermId: '',
    previousSchool: '',
    previousPerformance: '',
    monthlyFeeAmount: '',
    amountReceivedWithForm: '',
    openingBalanceAmount: '',
    receiptNumber: '',
    balanceDueOn: '',
    reviewNote: '',
    physicalDocumentsVerified: false,
  });
  useEffect(() => {
    setForm((current) => ({ ...current, academicOfferingId: '' }));
  }, [branchId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const application = await submitAdmission({
        academicOfferingId: form.academicOfferingId,
        studentFullName: form.studentFullName,
        studentCnic: form.studentCnic,
        guardianFullName: form.guardianFullName,
        guardianContactNumber: form.guardianContactNumber,
        previousSchool: form.previousSchool || undefined,
        previousPerformance: form.previousPerformance || undefined,
      }).unwrap();
      const result = (await reviewAdmission({
        id: application.id,
        body: {
          status: 'APPROVED',
          academicOfferingId: form.academicOfferingId,
          academicTermId: form.academicTermId,
          monthlyFeeAmount: form.monthlyFeeAmount ? Number(form.monthlyFeeAmount) : undefined,
          amountReceivedWithForm: form.amountReceivedWithForm
            ? Number(form.amountReceivedWithForm)
            : undefined,
          openingBalanceAmount: form.openingBalanceAmount
            ? Number(form.openingBalanceAmount)
            : undefined,
          receiptNumber: form.receiptNumber || undefined,
          balanceDueOn: form.balanceDueOn || undefined,
          reviewNote: form.reviewNote || undefined,
          physicalDocumentsVerified: form.physicalDocumentsVerified,
        },
      }).unwrap()) as ApiRecord & {
        student?: ApiRecord;
        credentials?: { contactNumber?: string; initialPassword?: string };
      };
      setCredentials(result.credentials ?? null);
      if (result.student?.id) onCreated(result.student.id);
      toast.success('Student enrolled and admission approved.');
    } catch {
      toast.error(
        'Student could not be enrolled. Verify unique CNIC, offering, term, and required fields.',
      );
    }
  }
  return (
    <section
      role="tabpanel"
      id="enroll-panel"
      aria-labelledby="enroll-tab"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl tracking-[-.04em]">Enroll an existing student</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This creates and immediately approves the required admission record. Registration
          numbering, fee setup, audit history, and learner access use the same backend workflow as a
          normal admission.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Student full name
          <input
            className="field"
            required
            value={form.studentFullName}
            onChange={(event) => setForm({ ...form, studentFullName: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Student CNIC / B-Form
          <input
            className="field"
            required
            inputMode="numeric"
            pattern="\d{13}"
            maxLength={13}
            value={form.studentCnic}
            onChange={(event) =>
              setForm({ ...form, studentCnic: event.target.value.replace(/\D/g, '') })
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Guardian full name
          <input
            className="field"
            required
            value={form.guardianFullName}
            onChange={(event) => setForm({ ...form, guardianFullName: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Guardian contact number
          <input
            className="field"
            required
            inputMode="numeric"
            value={form.guardianContactNumber}
            onChange={(event) =>
              setForm({ ...form, guardianContactNumber: event.target.value.replace(/\D/g, '') })
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            required
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Select campus</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Class or course
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
          Academic term
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
          Balance due date
          <input
            className="field"
            type="date"
            value={form.balanceDueOn}
            onChange={(event) => setForm({ ...form, balanceDueOn: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Previous school <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            className="field"
            value={form.previousSchool}
            onChange={(event) => setForm({ ...form, previousSchool: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Previous performance <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            className="field"
            value={form.previousPerformance}
            onChange={(event) => setForm({ ...form, previousPerformance: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Admission note <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            className="field min-h-24"
            value={form.reviewNote}
            onChange={(event) => setForm({ ...form, reviewNote: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input
            type="checkbox"
            checked={form.physicalDocumentsVerified}
            onChange={(event) =>
              setForm({ ...form, physicalDocumentsVerified: event.target.checked })
            }
          />
          Physical admission documents have been verified
        </label>
        <button className="button-primary w-fit" disabled={isLoading}>
          {isLoading ? 'Enrolling...' : 'Enroll and approve student'}
        </button>
      </form>
      {credentials ? (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-950">Save learner credentials now.</p>
          <p className="mt-2 font-mono text-sm text-amber-950">
            Contact: {credentials.contactNumber} · Password: {credentials.initialPassword}
          </p>
        </div>
      ) : null}
    </section>
  );
}
