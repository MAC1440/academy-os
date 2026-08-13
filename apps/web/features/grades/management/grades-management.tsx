'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  ClipboardPenLine,
  Download,
  GraduationCap,
  Printer,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useGetStudentAttendanceRosterQuery } from '@web/features/attendance/attendance.api';
import { useToast } from '@web/components/toast-provider';
import { DataTable, DataTableControls, TableEmpty } from '@web/components/data-table';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListStudentsQuery } from '@web/features/students/students.api';
import {
  useCreateAssessmentMutation,
  useGetAssessmentMarksQuery,
  useGetStudentPerformanceQuery,
  useListAssessmentsQuery,
  useSaveAssessmentMarksMutation,
} from '../grades.api';
import type { ApiRecord } from '@web/store/api/base-api';

const today = new Date().toISOString().slice(0, 10);
const tabs = [
  { id: 'assessments', label: 'Assessments', icon: ClipboardPenLine },
  { id: 'marks', label: 'Enter marks', icon: GraduationCap },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
] as const;
type Offering = ApiRecord & {
  schoolClass?: ApiRecord;
  course?: ApiRecord;
  subjects?: Array<ApiRecord & { subject?: ApiRecord }>;
};

export function GradesManagement() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('assessments');
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Grades</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Keep regular work separate from festival assessments such as mid-terms, sendups, finals,
          and test series.
        </p>
      </header>
      <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === 'assessments' ? <Assessments /> : null}
      {tab === 'marks' ? <Marks /> : null}
      {tab === 'performance' ? <Performance /> : null}
    </div>
  );
}

function Picker({
  branchId,
  offeringId,
  onBranch,
  onOffering,
}: {
  branchId: string;
  offeringId: string;
  onBranch: (id: string) => void;
  onOffering: (id: string) => void;
}) {
  const { data: branches = [] } = useListBranchesQuery();
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Campus
        <select
          className="field"
          value={branchId}
          onChange={(event) => {
            onBranch(event.target.value);
            onOffering('');
          }}
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
          disabled={!branchId}
          value={offeringId}
          onChange={(event) => onOffering(event.target.value)}
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
    </div>
  );
}

function Assessments() {
  const [branchId, setBranchId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const { data: assessments = [] } = useListAssessmentsQuery(offeringId || skipToken);
  const [create] = useCreateAssessmentMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    assessmentType: 'REGULAR' as 'REGULAR' | 'FESTIVAL',
    heldOn: today,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create({ offeringId, ...form }).unwrap();
      setForm({ title: '', assessmentType: 'REGULAR', heldOn: today });
      toast.success('Assessment created.');
    } catch {
      toast.error('Assessment could not be created.');
    }
  }
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Picker
        branchId={branchId}
        offeringId={offeringId}
        onBranch={setBranchId}
        onOffering={setOfferingId}
      />
      {offeringId ? (
        <>
          <form
            onSubmit={submit}
            className="grid gap-3 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-3"
          >
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input
                className="field"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Weekly test 1"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Type
              <select
                className="field"
                value={form.assessmentType}
                onChange={(event) =>
                  setForm({ ...form, assessmentType: event.target.value as 'REGULAR' | 'FESTIVAL' })
                }
              >
                <option value="REGULAR">Regular</option>
                <option value="FESTIVAL">Festival / exam</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Held on
              <input
                className="field"
                type="date"
                value={form.heldOn}
                onChange={(event) => setForm({ ...form, heldOn: event.target.value })}
              />
            </label>
            <button className="button-primary w-fit">Create assessment</button>
          </form>
          <div className="grid gap-3">
            {assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assessments yet.</p>
            ) : (
              assessments.map((assessment) => (
                <article
                  key={assessment.id}
                  className="flex items-center justify-between rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{String(assessment.title)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {String(assessment.assessmentType)} · {String(assessment.heldOn).slice(0, 10)}
                    </p>
                  </div>
                  <span className="text-sm text-teal-700">
                    {String((assessment._count as ApiRecord | undefined)?.marks ?? 0)} marks
                  </span>
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose an offering to create or view assessments.
        </p>
      )}
    </section>
  );
}

function Marks() {
  const [branchId, setBranchId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const offering = offerings.find((item) => item.id === offeringId) as Offering | undefined;
  const { data: assessments = [] } = useListAssessmentsQuery(offeringId || skipToken);
  const roster = useGetStudentAttendanceRosterQuery(
    offeringId ? { offeringId, date: today } : skipToken,
  );
  const [entryMode, setEntryMode] = useState<'PLANNED' | 'IMPROMPTU'>('PLANNED');
  const [assessmentId, setAssessmentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [maximum, setMaximum] = useState('100');
  const [impromptuDate, setImpromptuDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [save, { isLoading }] = useSaveAssessmentMarksMutation();
  const [createAssessment] = useCreateAssessmentMutation();
  const toast = useToast();
  const subjects = (offering?.subjects ?? [])
    .map((item) => item.subject)
    .filter(Boolean) as ApiRecord[];
  const existingMarks = useGetAssessmentMarksQuery(assessmentId || skipToken);
  const rosterStudents = roster.data ?? [];
  const visibleStudents = useMemo(
    () =>
      rosterStudents.filter((student) =>
        `${String(student.fullName)} ${String(student.registrationNumber ?? '')}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [rosterStudents, search],
  );
  useEffect(() => {
    const saved: Record<string, string> = {};
    (existingMarks.data ?? [])
      .filter((mark) => String(mark.subjectId) === subjectId)
      .forEach((mark) => {
        saved[String(mark.studentId)] = String(mark.obtainedMarks);
      });
    setValues(saved);
  }, [assessmentId, existingMarks.data, subjectId]);
  useEffect(() => {
    setAssessmentId('');
    setValues({});
  }, [offeringId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    let targetAssessmentId = assessmentId;
    if (entryMode === 'IMPROMPTU') {
      const subject = subjects.find((item) => item.id === subjectId);
      if (!subject) {
        toast.error('Choose a subject for this impromptu test.');
        return;
      }
      try {
        const created = await createAssessment({
          offeringId,
          title: `Impromptu test · ${String(subject.name)} · ${impromptuDate}`,
          assessmentType: 'REGULAR',
          heldOn: impromptuDate,
        }).unwrap();
        targetAssessmentId = created.id;
        setAssessmentId(created.id);
      } catch {
        toast.error('The impromptu test could not be created.');
        return;
      }
    }
    const marks = Object.entries(values)
      .filter(([, value]) => value !== '')
      .map(([studentId, obtainedMarks]) => ({
        studentId,
        subjectId,
        maximumMarks: Number(maximum),
        obtainedMarks: Number(obtainedMarks),
      }));
    if (!marks.length) {
      toast.error('Enter at least one mark.');
      return;
    }
    try {
      await save({ assessmentId: targetAssessmentId, marks }).unwrap();
      toast.success(`${marks.length} marks saved.`);
    } catch {
      toast.error('Marks could not be saved. Check they do not exceed the maximum.');
    }
  }
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setOfferingId('');
            }}
          >
            <option value="">Select campus</option>
            {useListBranchesQuery().data?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {branchId ? (
        <div
          role="tablist"
          aria-label="Classes"
          className="flex gap-2 overflow-x-auto border-b border-border pb-3"
        >
          {offerings.map((item) => {
            const label = String(
              (item.schoolClass as ApiRecord | undefined)?.name ??
                (item.course as ApiRecord | undefined)?.name ??
                'Class',
            );
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={offeringId === item.id}
                onClick={() => setOfferingId(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${offeringId === item.id ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {label}
                {item.sectionName ? ` · ${String(item.sectionName)}` : ''}
              </button>
            );
          })}
        </div>
      ) : null}
      {offeringId ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium">
              Test source
              <select
                className="field"
                value={entryMode}
                onChange={(event) => setEntryMode(event.target.value as 'PLANNED' | 'IMPROMPTU')}
              >
                <option value="PLANNED">Planned assessment</option>
                <option value="IMPROMPTU">Impromptu test</option>
              </select>
            </label>
            {entryMode === 'PLANNED' ? (
              <label className="grid gap-1 text-sm font-medium">
                Assessment
                <select
                  className="field"
                  required
                  value={assessmentId}
                  onChange={(event) => setAssessmentId(event.target.value)}
                >
                  <option value="">Select assessment</option>
                  {assessments.map((assessment) => (
                    <option key={assessment.id} value={assessment.id}>
                      {String(assessment.title)} · {String(assessment.assessmentType)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="grid gap-1 text-sm font-medium">
                Test date
                <input
                  className="field"
                  type="date"
                  value={impromptuDate}
                  onChange={(event) => setImpromptuDate(event.target.value)}
                />
              </label>
            )}
            <label className="grid gap-1 text-sm font-medium">
              Subject
              <select
                className="field"
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {String(subject.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Maximum marks
              <input
                className="field"
                required
                type="number"
                min="1"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
              />
            </label>
          </div>
          <DataTableControls
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search roll number or student"
            sortValue="roll"
            onSortChange={() => undefined}
            sortOptions={[{ value: 'roll', label: 'Roll number' }]}
          />
          <DataTable minWidth="44rem">
            <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Roll number</th>
                <th className="px-4 py-3 font-semibold">Student name</th>
                <th className="px-4 py-3 text-right font-semibold">Marks / {maximum}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.isLoading ? <TableEmpty colSpan={3}>Loading students...</TableEmpty> : null}
              {!roster.isLoading && visibleStudents.length === 0 ? (
                <TableEmpty colSpan={3}>No students in this class match the search.</TableEmpty>
              ) : null}
              {visibleStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium">
                    {String(student.registrationNumber ?? '—')}
                  </td>
                  <td className="px-4 py-3">{String(student.fullName)}</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      className="field ml-auto w-28 text-right"
                      type="number"
                      min="0"
                      max={maximum}
                      value={values[student.id] ?? ''}
                      onChange={(event) =>
                        setValues({ ...values, [student.id]: event.target.value })
                      }
                      placeholder="—"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <button
            className="button-primary"
            disabled={(entryMode === 'PLANNED' && !assessmentId) || !subjectId || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save entered marks'}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function Performance() {
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const { data: students = [] } = useListStudentsQuery(branchId ? { branchId } : undefined);
  const [studentId, setStudentId] = useState('');
  const { data: marks = [] } = useGetStudentPerformanceQuery(studentId || skipToken);
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setStudentId('');
            }}
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
          Student
          <select
            className="field"
            disabled={!branchId}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {String(student.studentFullName)} · {String(student.registrationNumber ?? '')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {studentId ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Download or print a shareable performance report for this student.
            </p>
            <ReportActions
              student={students.find((student) => student.id === studentId)}
              marks={marks}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3">Assessment</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Marks</th>
                  <th className="p-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark) => (
                  <tr key={mark.id} className="border-b border-border/70">
                    <td className="p-3 font-medium">
                      {String((mark.assessment as ApiRecord | undefined)?.title ?? '')}
                    </td>
                    <td className="p-3">
                      {String((mark.subject as ApiRecord | undefined)?.name ?? '')}
                    </td>
                    <td className="p-3">
                      {String(mark.obtainedMarks)} / {String(mark.maximumMarks)}
                    </td>
                    <td className="p-3">{Number(mark.percentage ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a student to view their grades.</p>
      )}
    </section>
  );
}

function ReportActions({ student, marks }: { student?: ApiRecord; marks: ApiRecord[] }) {
  const toast = useToast();
  const rows = marks.map((mark) => ({
    assessment: String((mark.assessment as ApiRecord | undefined)?.title ?? ''),
    subject: String((mark.subject as ApiRecord | undefined)?.name ?? ''),
    score: `${String(mark.obtainedMarks)} / ${String(mark.maximumMarks)}`,
    percentage: `${Number(mark.percentage ?? 0).toFixed(1)}%`,
  }));
  async function downloadPdf() {
    if (!student) return;
    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ unit: 'pt', format: 'a4' });
    document.setFontSize(20);
    document.text('AcademyOS Performance Report', 48, 54);
    document.setFontSize(11);
    document.text(`Student: ${String(student.studentFullName)}`, 48, 82);
    document.text(`Registration: ${String(student.registrationNumber ?? 'Not assigned')}`, 48, 100);
    document.text(`Generated: ${new Date().toLocaleDateString('en-PK')}`, 48, 118);
    let y = 154;
    document.setFontSize(10);
    document.text('Assessment', 48, y);
    document.text('Subject', 210, y);
    document.text('Marks', 360, y);
    document.text('Percent', 460, y);
    document.setDrawColor(180);
    document.line(48, y + 6, 545, y + 6);
    y += 24;
    rows.forEach((row, index) => {
      if (y > 760) {
        document.addPage();
        y = 56;
      }
      document.text(row.assessment.slice(0, 28), 48, y);
      document.text(row.subject.slice(0, 22), 210, y);
      document.text(row.score, 360, y);
      document.text(row.percentage, 460, y);
      y += 20;
      if (index === rows.length - 1 && !rows.length) y += 1;
    });
    if (!rows.length) document.text('No marks have been recorded yet.', 48, y);
    document.save(
      `${String(student.studentFullName)
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase()}-performance-report.pdf`,
    );
    toast.success('Performance report downloaded as PDF.');
  }
  function printReport() {
    if (!student) return;
    const report = window.open('', '_blank', 'noopener,noreferrer');
    if (!report) {
      toast.error('Allow pop-ups to print this report.');
      return;
    }
    const escape = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (character) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ??
          character,
      );
    report.document.write(
      `<html><head><title>Performance report</title><style>body{font:14px Arial;padding:36px;color:#17222a}h1{margin:0 0 18px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border-bottom:1px solid #cbd5dc;text-align:left}th{background:#edf4f3}</style></head><body><h1>AcademyOS Performance Report</h1><p><strong>Student:</strong> ${escape(String(student.studentFullName))}<br/><strong>Registration:</strong> ${escape(String(student.registrationNumber ?? 'Not assigned'))}</p><table><thead><tr><th>Assessment</th><th>Subject</th><th>Marks</th><th>Percentage</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escape(row.assessment)}</td><td>${escape(row.subject)}</td><td>${escape(row.score)}</td><td>${escape(row.percentage)}</td></tr>`).join('') || '<tr><td colspan="4">No marks have been recorded yet.</td></tr>'}</tbody></table></body></html>`,
    );
    report.document.close();
    report.focus();
    report.print();
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="button-secondary inline-flex items-center gap-2"
        onClick={printReport}
      >
        <Printer size={16} /> Print
      </button>
      <button
        type="button"
        className="button-primary inline-flex items-center gap-2"
        onClick={downloadPdf}
      >
        <Download size={16} /> Download PDF
      </button>
    </div>
  );
}
