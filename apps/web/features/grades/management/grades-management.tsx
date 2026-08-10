'use client';

import { FormEvent, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ClipboardPenLine, GraduationCap, TrendingUp } from 'lucide-react';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useGetStudentAttendanceRosterQuery } from '@web/features/attendance/attendance.api';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListStudentsQuery } from '@web/features/students/students.api';
import {
  useCreateAssessmentMutation,
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
        <p className="eyebrow">Grades and performance</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.05em]">
          Record the work. See the progress.
        </h1>
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
  const [assessmentId, setAssessmentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [maximum, setMaximum] = useState('100');
  const [values, setValues] = useState<Record<string, string>>({});
  const [save, { isLoading }] = useSaveAssessmentMarksMutation();
  const toast = useToast();
  const subjects = (offering?.subjects ?? [])
    .map((item) => item.subject)
    .filter(Boolean) as ApiRecord[];
  async function submit(event: FormEvent) {
    event.preventDefault();
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
      await save({ assessmentId, marks }).unwrap();
      toast.success(`${marks.length} marks saved.`);
    } catch {
      toast.error('Marks could not be saved. Check they do not exceed the maximum.');
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
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
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
                    {String(assessment.title)}
                  </option>
                ))}
              </select>
            </label>
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
          <div className="grid gap-2">
            {(roster.data ?? []).map((student) => (
              <label
                key={student.id}
                className="grid grid-cols-[1fr_8rem] items-center gap-3 rounded-xl border border-border p-3"
              >
                <span>
                  <strong className="block">{String(student.fullName)}</strong>
                  <small className="text-muted-foreground">
                    {String(student.registrationNumber ?? '')}
                  </small>
                </span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  max={maximum}
                  value={values[student.id] ?? ''}
                  onChange={(event) => setValues({ ...values, [student.id]: event.target.value })}
                  placeholder="Marks"
                />
              </label>
            ))}
          </div>
          <button className="button-primary" disabled={!assessmentId || !subjectId || isLoading}>
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
      ) : (
        <p className="text-sm text-muted-foreground">Select a student to view their grades.</p>
      )}
    </section>
  );
}
