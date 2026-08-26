'use client';

import { Pencil, Scale, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import { useDeleteAdmissionMutation, useGetAdmissionQuery } from '../admissions.api';
import { offeringName } from '../admissions.types';
import {
  AdmissionUnavailable,
  AdmissionsBackLink,
  apiErrorMessage,
  formatAdmissionDate,
} from './admission-shared';

export function AdmissionDetailScreen({ admissionId }: { admissionId: string }) {
  const admission = useGetAdmissionQuery(admissionId);
  const [remove, removeState] = useDeleteAdmissionMutation();
  const { confirm } = useConfirmation();
  const toast = useToast();
  const router = useRouter();

  async function deleteRejected() {
    if (
      !(await confirm({
        title: 'Delete rejected application?',
        description: 'This permanently removes the rejected application and cannot be undone.',
        confirmLabel: 'Delete application',
      }))
    )
      return;
    try {
      await remove(admissionId).unwrap();
      toast.success('Rejected application deleted.');
      router.push('/admissions');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The application could not be deleted.'));
    }
  }

  if (admission.isLoading)
    return <p className="text-sm text-muted-foreground">Loading admission…</p>;
  if (admission.isError || !admission.data)
    return (
      <AdmissionUnavailable message="It may have been removed or you may no longer have access." />
    );

  const data = admission.data;
  const pending = data.status === 'PENDING';
  const rejected = data.status === 'REJECTED';
  const fields: Array<[string, unknown]> = [
    ['Student full name', data.studentFullName],
    ['Student CNIC / B-Form', data.studentCnic],
    ['Guardian full name', data.guardianFullName],
    ['Guardian contact', data.guardianContactNumber],
    ['Campus', data.branch?.name ?? 'Not available'],
    ['Class / course', offeringName(data)],
    [
      'Academic term',
      data.academicTerm?.name ?? (pending ? 'Assigned during approval' : 'Not recorded'),
    ],
    ['Previous school', data.previousSchool || 'Not provided'],
    ['Previous performance', data.previousPerformance || 'Not provided'],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="border-b border-border pb-6">
        <AdmissionsBackLink />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-balance font-display text-4xl tracking-[-.04em]">
                {data.studentFullName}
              </h1>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {statusLabel(data.status)}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Submitted {formatAdmissionDate(data.createdAt)} · {data.studentCnic}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pending ? (
              <>
                <Link
                  href={`/admissions/${admissionId}/edit`}
                  className="button-secondary inline-flex items-center gap-2"
                >
                  <Pencil size={16} /> Edit application
                </Link>
                <Link
                  href={`/admissions/${admissionId}/review`}
                  className="button-primary inline-flex items-center gap-2"
                >
                  <Scale size={16} /> Review application
                </Link>
              </>
            ) : null}
            {rejected ? (
              <button
                type="button"
                className="button-destructive inline-flex items-center gap-2"
                disabled={removeState.isLoading}
                onClick={deleteRejected}
              >
                <Trash2 size={16} /> {removeState.isLoading ? 'Deleting…' : 'Delete'}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section>
        <h2 className="font-display text-2xl">Application details</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-5 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1.5 break-words text-sm font-medium leading-6">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {data.formData && Object.keys(data.formData).length ? (
        <section>
          <h2 className="font-display text-2xl">Additional submitted information</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-5 border-y border-border py-6 sm:grid-cols-2">
            {Object.entries(data.formData).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {humanize(key)}
                </dt>
                <dd className="mt-1.5 break-words text-sm leading-6">{displayValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {!pending ? (
        <section className="rounded-2xl bg-muted/35 p-5 sm:p-6">
          <h2 className="font-display text-2xl">Decision</h2>
          <p className="mt-3 text-sm leading-6">
            {data.reviewNote || 'No decision note was recorded.'}
          </p>
          {data.physicalDocumentsVerificationNote ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Documents: {data.physicalDocumentsVerificationNote}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function statusLabel(status: string) {
  return status[0] + status.slice(1).toLocaleLowerCase();
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object')
    return Object.entries(value)
      .map(([key, item]) => `${humanize(key)}: ${displayValue(item)}`)
      .join(' · ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
