'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListAcademicTermsQuery } from '@web/features/settings/settings.api';
import {
  useBulkImportStudentsMutation,
  useListStudentsQuery,
  usePreviewStudentBulkImportMutation,
} from '../students.api';
import type { ApiRecord } from '@web/store/api/base-api';
type ReviewRow = {
  row: number;
  input: ApiRecord;
  source: ApiRecord;
  issues: string[];
  alreadyEnrolled?: boolean;
};
const required = [
  'campus_name',
  'class_or_course',
  'academic_term_name',
  'student_full_name',
  'student_cnic',
  'guardian_full_name',
  'guardian_contact_number',
];
const keys: Record<string, string> = {
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
  const [review, setReview] = useState<ReviewRow[]>([]);
  const [index, setIndex] = useState(0);
  const [preview, { isLoading: checking }] = usePreviewStudentBulkImportMutation();
  const [importRows, { isLoading: importing }] = useBulkImportStudentsMutation();
  const existingStudents = useListStudentsQuery();

  async function importValidated(rowsToImport: ReviewRow[]) {
    if (!rowsToImport.length) return [];
    const result = (await importRows({
      rows: rowsToImport.map((item) => item.input),
    }).unwrap()) as ApiRecord;
    const outcomes = Array.isArray(result.results) ? (result.results as ApiRecord[]) : [];
    const failedRows: ReviewRow[] = [];
    outcomes.forEach((outcome, outcomeIndex) => {
      const failedRow = rowsToImport[outcomeIndex];
      if (outcome.success === false && failedRow) {
        failedRows.push({
          ...failedRow,
          issues: [String(outcome.message ?? 'Could not import this student')],
        });
      }
    });
    const imported = Number(result.imported ?? rowsToImport.length - failedRows.length);
    const skipped = Number(result.skipped ?? 0);
    if (imported) {
      toast.success(`Imported ${imported} student${imported === 1 ? '' : 's'}.`);
      onImported();
    }
    if (skipped) {
      toast.success(`Skipped ${skipped} student${skipped === 1 ? '' : 's'} already enrolled.`);
    }
    return failedRows;
  }

  async function validate(input = rows) {
    try {
      const r = await preview({ rows: input }).unwrap();
      const next = ((r.rows as Omit<ReviewRow, 'source'>[]) ?? []).map((item, rowIndex) => ({
        ...item,
        source: input[rowIndex] ?? item.input,
      }));
      const enrolledCnics = new Set(
        (existingStudents.data ?? []).map((student) => String(student.studentCnic ?? '')),
      );
      const isExisting = (item: ReviewRow) =>
        item.alreadyEnrolled || enrolledCnics.has(String(item.input.studentCnic ?? ''));
      const existingRows = next.filter(isExisting);
      const validRows = next.filter((item) => !isExisting(item) && !item.issues.length);
      const faultyRows = next.filter((item) => !isExisting(item) && item.issues.length);
      const importFailures = await importValidated(validRows);
      setReview([...faultyRows, ...importFailures]);
      setIndex(0);
      if (existingRows.length)
        toast.success(
          `Skipped ${existingRows.length} student${existingRows.length === 1 ? '' : 's'} already enrolled in the selected class.`,
        );
      if (faultyRows.length || importFailures.length)
        toast.error(
          `${faultyRows.length + importFailures.length} student${faultyRows.length + importFailures.length === 1 ? ' needs' : 's need'} attention.`,
        );
    } catch {
      toast.error('The CSV could not be validated or imported.');
    }
  }
  async function file(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const lines = (await f.text()).trim().split(/\r?\n/).filter(Boolean);
    const heads =
      lines[0]
        ?.replace(/^\uFEFF/, '')
        .split(',')
        .map((x) => x.trim().toLowerCase()) ?? [];
    if (required.some((x) => !heads.includes(x))) {
      toast.error('The CSV is missing a required column.');
      return;
    }
    setRows(
      lines.slice(1).map(
        (line) =>
          Object.fromEntries(
            heads
              .map((h, i) => {
                const v = line.split(',')[i]?.trim() ?? '';
                if (!v) return [keys[h], undefined];
                if (
                  [
                    'monthly_fee_amount',
                    'amount_received_with_form',
                    'opening_balance_amount',
                  ].includes(h)
                )
                  return [keys[h], Number(v)];
                if (h === 'physical_documents_verified')
                  return [keys[h], v.toUpperCase() === 'TRUE'];
                return [keys[h], v];
              })
              .filter(([, v]) => v !== undefined),
          ) as ApiRecord,
      ),
    );
    setReview([]);
  }
  function update(input: ApiRecord) {
    setReview((c) => c.map((r, i) => (i === index ? { ...r, input } : r)));
  }
  async function next() {
    const item = review[index]!;
    try {
      const r = await preview({ rows: [item.input] }).unwrap();
      const checked = {
        ...(r.rows as Omit<ReviewRow, 'source'>[])[0]!,
        source: item.source,
      };
      if (checked.issues.length) {
        setReview((current) =>
          current.map((row, rowIndex) => (rowIndex === index ? { ...checked, row: row.row } : row)),
        );
        toast.error('This student still needs attention. Moving to the next entry.');
        setIndex((current) => Math.min(current + 1, review.length - 1));
        return;
      }
      const importFailures = await importValidated([{ ...checked, row: item.row }]);
      if (importFailures.length) {
        setReview((current) =>
          current.map((row, rowIndex) => (rowIndex === index ? importFailures[0]! : row)),
        );
        return;
      }
      setReview((current) => current.filter((_, rowIndex) => rowIndex !== index));
      setIndex(0);
    } catch {
      toast.error('Could not check this student.');
    }
  }
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-display text-3xl tracking-[-.04em]">Import students from CSV</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Valid rows import right away. Correct the remaining students one at a time.
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
      <input className="field max-w-xl" type="file" accept=".csv" onChange={file} />
      {rows.length ? (
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          disabled={checking}
          onClick={() => validate()}
        >
          <Upload size={16} />
          {checking ? 'Checking...' : `Review ${rows.length} students`}
        </button>
      ) : null}
      {review.length ? (
        <dialog
          open
          className="fixed inset-0 z-50 m-auto max-h-[88vh] w-[min(46rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
        >
          <p className="text-sm text-muted-foreground">
            Student needing attention {index + 1} of {review.length}
          </p>
          <ReviewForm item={review[index]!} onChange={update} />
          <div className="mt-5 flex gap-2">
            <button type="button" className="button-secondary" onClick={() => setReview([])}>
              Cancel
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={index <= 0}
              onClick={() => setIndex((current) => current - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="button-primary"
              disabled={checking || importing}
              onClick={next}
            >
              {checking || importing ? 'Saving...' : 'Save & import next'}
            </button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
function CsvValue({ source, field }: { source: ApiRecord; field: string }) {
  const value = source[field];
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <span className="text-xs text-muted-foreground">
      CSV: {hasValue ? String(value) : 'No data found for this entry.'}
    </span>
  );
}

function ReviewForm({ item, onChange }: { item: ReviewRow; onChange: (input: ApiRecord) => void }) {
  const { data: branches = [] } = useListBranchesQuery();
  const { data: terms = [] } = useListAcademicTermsQuery();
  const branch = branches.find(
    (x) => String(x.name).toLowerCase() === String(item.input.campusName ?? '').toLowerCase(),
  );
  const { data: offerings = [] } = useListOfferingsQuery(branch?.id ?? skipToken);
  const [draft, setDraft] = useState(item.input);
  const [changedFields, setChangedFields] = useState<string[]>([]);
  useEffect(() => {
    setDraft(item.input);
    setChangedFields([]);
  }, [item.row]);
  function set(key: string, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setChangedFields((current) => [...new Set([...current, key])]);
    onChange(next);
  }
  const issue = item.issues.join('; ');
  const selectedOfferings = offerings.filter(
    (offering) =>
      String(
        (offering.schoolClass as ApiRecord | undefined)?.name ??
          (offering.course as ApiRecord | undefined)?.name ??
          '',
      ) === String(draft.classOrCourse ?? ''),
  );
  const fieldIssue = (field: string) => {
    if (changedFields.includes(field)) return false;
    const lowerIssue = issue.toLowerCase();
    if (field === 'campusName') return /campus|offering/.test(lowerIssue);
    if (field === 'classOrCourse') return /class|course|offering/.test(lowerIssue);
    if (field === 'sectionName') return /section|offering/.test(lowerIssue);
    if (field === 'academicTermName') return /term/.test(lowerIssue);
    if (field === 'studentCnic') return /cnic|b-form/.test(lowerIssue);
    if (field === 'guardianContactNumber') return /guardian contact/.test(lowerIssue);
    if (field === 'studentFullName') return /student name/.test(lowerIssue);
    if (field === 'guardianFullName') return /guardian name/.test(lowerIssue);
    return false;
  };
  return (
    <div className="mt-3">
      <h3 className="font-display text-2xl">
        Correct {String(draft.studentFullName ?? 'student')}
      </h3>
      {issue ? (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Original issue: {issue}</p>
      ) : (
        <p className="mt-2 text-sm text-emerald-700">Ready to import.</p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Campus
          <select
            className="field"
            value={String(draft.campusName ?? '')}
            onChange={(e) => {
              const next = {
                ...draft,
                campusName: e.target.value,
                classOrCourse: '',
                sectionName: '',
              };
              setDraft(next);
              setChangedFields((current) => [
                ...new Set([...current, 'campusName', 'classOrCourse', 'sectionName']),
              ]);
              onChange(next);
            }}
          >
            <option value="">Choose campus</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.name)}>
                {String(b.name)}
              </option>
            ))}
          </select>
          {fieldIssue('campusName') ? (
            <span className="text-xs text-rose-700 dark:text-rose-300">
              Choose a campus that contains this class.
            </span>
          ) : null}
          <CsvValue source={item.source} field="campusName" />
        </label>
        <label className="grid gap-1 text-sm">
          Class / course
          <select
            className="field"
            value={String(draft.classOrCourse ?? '')}
            onChange={(e) => {
              const o = offerings.find(
                (x) =>
                  String(
                    (x.schoolClass as ApiRecord | undefined)?.name ??
                      (x.course as ApiRecord | undefined)?.name,
                  ) === e.target.value,
              );
              const next = { ...draft, classOrCourse: e.target.value, sectionName: '' };
              setDraft(next);
              setChangedFields((current) => [
                ...new Set([...current, 'classOrCourse', 'sectionName']),
              ]);
              onChange(next);
            }}
          >
            <option value="">Choose class</option>
            {[
              ...new Map(
                offerings.map((o) => {
                  const n = String(
                    (o.schoolClass as ApiRecord | undefined)?.name ??
                      (o.course as ApiRecord | undefined)?.name ??
                      '',
                  );
                  return [n, o];
                }),
              ).values(),
            ].map((o) => {
              const n = String(
                (o.schoolClass as ApiRecord | undefined)?.name ??
                  (o.course as ApiRecord | undefined)?.name ??
                  '',
              );
              return (
                <option key={o.id} value={n}>
                  {n}
                  {o.sectionName ? ` — ${String(o.sectionName)}` : ''}
                </option>
              );
            })}
          </select>
          {fieldIssue('classOrCourse') ? (
            <span className="text-xs text-rose-700 dark:text-rose-300">
              Choose the class or course from this campus.
            </span>
          ) : null}
          <CsvValue source={item.source} field="classOrCourse" />
        </label>
        <label className="grid gap-1 text-sm">
          Section
          <select
            className="field"
            value={String(draft.sectionName ?? '')}
            onChange={(e) => set('sectionName', e.target.value)}
          >
            <option value="">No section</option>
            {[
              ...new Set(selectedOfferings.map((o) => String(o.sectionName ?? '')).filter(Boolean)),
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {fieldIssue('sectionName') ? (
            <span className="text-xs text-rose-700 dark:text-rose-300">
              Choose the matching section, or leave it empty only when the class has no sections.
            </span>
          ) : null}
          <CsvValue source={item.source} field="sectionName" />
        </label>
        <label className="grid gap-1 text-sm">
          Academic term
          <select
            className="field"
            value={String(draft.academicTermName ?? '')}
            onChange={(e) => set('academicTermName', e.target.value)}
          >
            <option value="">Choose term</option>
            {terms.map((t) => (
              <option key={t.id} value={String(t.name)}>
                {String(t.name)}
              </option>
            ))}
          </select>
          {fieldIssue('academicTermName') ? (
            <span className="text-xs text-rose-700 dark:text-rose-300">
              Choose an active academic term.
            </span>
          ) : null}
          <CsvValue source={item.source} field="academicTermName" />
        </label>
        {[
          ['studentFullName', 'Student name', 'Enter the student name.'],
          ['studentCnic', 'CNIC / B-Form', 'Enter exactly 13 digits.'],
          ['guardianFullName', 'Guardian name', 'Enter the guardian name.'],
          ['guardianContactNumber', 'Guardian contact', 'Enter 7 to 15 digits.'],
        ].map(([key, label, message]) => (
          <label key={key} className="grid gap-1 text-sm">
            {label}
            <input
              className="field"
              value={String(draft[key!] ?? '')}
              onChange={(e) => set(key!, e.target.value)}
            />
            {fieldIssue(key!) ? (
              <span className="text-xs text-rose-700 dark:text-rose-300">{message}</span>
            ) : null}
            <CsvValue source={item.source} field={key!} />
          </label>
        ))}
      </div>
    </div>
  );
}
