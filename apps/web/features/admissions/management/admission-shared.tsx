import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AdmissionsBackLink({ label = 'All admissions' }: { label?: string }) {
  return (
    <Link
      href="/admissions"
      className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:underline"
    >
      <ArrowLeft size={16} /> {label}
    </Link>
  );
}

export function AdmissionUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-8 text-center">
      <h1 className="font-display text-2xl">Admission unavailable</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      <Link href="/admissions" className="button-primary mt-5 inline-flex">
        Return to admissions
      </Link>
    </div>
  );
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('data' in error)) return fallback;
  const data = error.data;
  if (typeof data !== 'object' || data === null) return fallback;
  if ('errors' in data && Array.isArray(data.errors) && typeof data.errors[0] === 'string')
    return data.errors[0];
  return 'message' in data && typeof data.message === 'string' ? data.message : fallback;
}

export function formatAdmissionDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
