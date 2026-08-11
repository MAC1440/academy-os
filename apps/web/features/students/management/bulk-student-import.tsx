'use client';

import { ChangeEvent, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import {
  useBulkImportStudentsMutation,
  usePreviewStudentBulkImportMutation,
} from '../students.api';
import type { ApiRecord } from '@web/store/api/base-api';

const requiredHeaders = [
  'campus_name',
  'class_or_course',
  'academic_term_name',
  'student_full_name',
  'student_cnic',
  'guardian_full_name',
  'guardian_contact_number',
];
const keyMap: Record<string, string> = {
  campus_name: 'campusName',
  class_or_course: 'classOrCourse',
  section_name: 'sectionName',
  academic_term_name: 'academicTermName',
  student_full_name: 'studentFullName',
  student_cnic: 'studentCnic',
  guardian_full_name: 'guardianFullName',
  guardian_contact_number: 'guardianContactNumber',
  monthly_fee_amount: 'monthlyFeeAmount',
  amount_received_with_form: 'amountReceivedWithForm',
  opening_balance_amount: 'openingBalanceAmount',
  receipt_number: 'receiptNumber',
  balance_due_on: 'balanceDueOn',
  previous_school: 'previousSchool',
  previous_performance: 'previousPerformance',
  admission_note: 'admissionNote',
  physical_documents_verified: 'physicalDocumentsVerified',
};

export function BulkStudentImport({ onImported }: { onImported: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [reviewRows, setReviewRows] = useState<
    Array<{ row: number; input: ApiRecord; issues: string[] }>
  >([]);
  const [result, setResult] = useState<ApiRecord | null>(null);
  const [importRows, { isLoading }] = useBulkImportStudentsMutation();
  const [previewImport, { isLoading: previewing }] = usePreviewStudentBulkImportMutation();
  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/).filter(Boolean);
    const fileHeaders =
      lines[0]
        ?.replace(/^\uFEFF/, '')
        .split(',')
        .map((value) => value.trim().toLocaleLowerCase()) ?? [];
    if (requiredHeaders.some((header) => !fileHeaders.includes(header))) {
      toast.error(
        'The CSV is missing a required column. Download the template to check the headings.',
      );
      return;
    }
    const parsed = lines.slice(1).map((line) => {
      const values = line.split(',');
      return Object.fromEntries(
        fileHeaders
          .map((header, index) => {
            const value = values[index]?.trim() ?? '';
            if (
              [
                'monthly_fee_amount',
                'amount_received_with_form',
                'opening_balance_amount',
              ].includes(header)
            )
              return [keyMap[header], value ? Number(value) : undefined] as const;
            if (header === 'physical_documents_verified')
              return [keyMap[header], value ? value.toUpperCase() === 'TRUE' : undefined] as const;
            return [keyMap[header], value || undefined] as const;
          })
          .filter(([, value]) => value !== undefined),
      ) as ApiRecord;
    });
    setRows(parsed);
    setResult(null);
    setReviewRows([]);
  }
  async function preview() {
    try {
      const response = await previewImport({ rows }).unwrap();
      setReviewRows(
        (response.rows as Array<{ row: number; input: ApiRecord; issues: string[] }>) ?? [],
      );
    } catch {
      toast.error('The CSV could not be validated.');
    }
  }
  async function submit() {
    try {
      const response = await importRows({ rows: reviewRows.map((item) => item.input) }).unwrap();
      setResult(response);
      if (Number(response.imported ?? 0)) onImported();
      toast.success(`Imported ${String(response.imported ?? 0)} students.`);
    } catch {
      toast.error('The CSV could not be imported.');
    }
  }
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-display text-3xl tracking-[-.04em]">Import students from CSV</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Download the template, keep its column headings, then upload up to 200 students. Each row
          is validated independently.
        </p>
      </div>
      <a
        className="button-secondary inline-flex items-center gap-2"
        href="/student-bulk-import-sample.csv"
        download
      >
        <Download size={16} />
        Download CSV template
      </a>
      <label className="grid max-w-xl gap-2 text-sm font-medium">
        Choose completed CSV
        <input className="field" type="file" accept=".csv,text/csv" onChange={selectFile} />
      </label>
      {rows.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            {rows.length} students ready for validation.
          </p>
          <button
            type="button"
            className="button-primary inline-flex items-center gap-2"
            disabled={previewing}
            onClick={preview}
          >
            <Upload size={16} />
            {previewing ? 'Checking...' : 'Review import'}
          </button>
        </>
      ) : null}
      {result ? (
        <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          Imported: {String(result.imported ?? 0)} · Needs attention: {String(result.failed ?? 0)}.
          Review the response in the browser network panel for row details.
        </p>
      ) : null}
      {reviewRows.length ? (
        <dialog
          open
          className="fixed inset-0 z-50 m-auto max-h-[85vh] w-[min(50rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
        >
          <h3 className="font-display text-2xl">Review import</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing has been added yet. Fix the CSV details below, then upload it again.
          </p>
          <div className="mt-4 space-y-3">
            {reviewRows
              .filter((item) => item.issues.length)
              .map((item) => (
                <div key={item.row} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">
                    Row {item.row}: {String(item.input.studentFullName)}
                  </p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                    {item.issues.join(' · ')}
                  </p>
                </div>
              ))}
          </div>
          <button type="button" className="button-secondary mt-4" onClick={() => setReviewRows([])}>
            Close review
          </button>
          {!reviewRows.some((item) => item.issues.length) ? (
            <button
              type="button"
              className="button-primary ml-2"
              disabled={isLoading}
              onClick={submit}
            >
              {isLoading ? 'Importing...' : `Import ${reviewRows.length} students`}
            </button>
          ) : null}
        </dialog>
      ) : null}
    </section>
  );
}
