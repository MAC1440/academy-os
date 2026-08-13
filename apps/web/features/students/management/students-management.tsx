'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { KeyRound, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { DirectEnrollment } from './direct-enrollment';
import { BulkStudentImport } from './bulk-student-import';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListAcademicTermsQuery } from '@web/features/settings/settings.api';
import { useToast } from '@web/components/toast-provider';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import {
  useGetStudentQuery,
  useDeleteStudentMutation,
  useResetGuardianCredentialsMutation,
  useListStudentsQuery,
  useUpdateStudentMutation,
} from '../students.api';
import type { ApiRecord } from '@web/store/api/base-api';

type Student = ApiRecord & {
  branch?: ApiRecord;
  academicTerm?: ApiRecord;
  academicOffering?: ApiRecord & {
    schoolClass?: ApiRecord;
    course?: ApiRecord;
    academicGroup?: ApiRecord;
  };
  admissionApplication?: ApiRecord;
};

const tabs = [
  { id: 'directory', label: 'Students', icon: Users },
  { id: 'enroll', label: 'Add student', icon: UserPlus },
] as const;

export function StudentsManagement() {
  const [activeTab, setActiveTab] = useState<'directory' | 'enroll' | 'record'>('directory');
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: branches = [] } = useListBranchesQuery();
  const students = useListStudentsQuery(branchId ? { branchId } : undefined);
  const selected = useGetStudentQuery(selectedId ?? skipToken);
  const filteredStudents = useMemo(() => {
    return [...(students.data ?? [])]
      .filter((item) =>
        `${String(item.studentFullName ?? '')} ${String(item.registrationNumber ?? '')} ${String(item.guardianContactNumber ?? '')}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
      .sort((left, right) => {
        const leftValue =
          sort === 'registration'
            ? String(left.registrationNumber ?? '')
            : String(left.studentFullName ?? '');
        const rightValue =
          sort === 'registration'
            ? String(right.registrationNumber ?? '')
            : String(right.studentFullName ?? '');
        const comparison = leftValue.localeCompare(rightValue, 'en');
        return sort === 'name-desc' ? -comparison : comparison;
      });
  }, [search, sort, students.data]);
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setPage(1);
  }, [branchId, pageSize, search, sort]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    if (selectedId) setActiveTab('record');
  }, [selectedId]);
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Students</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Find a student, update their class or campus, or add someone who is already enrolled.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Student management"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const selectedTab = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-tab`}
              role="tab"
              type="button"
              aria-selected={selectedTab}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${selectedTab ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      {activeTab === 'directory' ? (
        <section
          role="tabpanel"
          id="directory-panel"
          aria-labelledby="directory-tab"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Campus
              <select
                className="field min-w-52"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
              >
                <option value="">All accessible campuses</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {String(branch.name)}
                  </option>
                ))}
              </select>
            </label>
            <div className="min-w-72 flex-1">
              <DataTableControls
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Name, registration number, or guardian phone"
                sortValue={sort}
                onSortChange={setSort}
                sortOptions={[
                  { value: 'name-asc', label: 'Name: A to Z' },
                  { value: 'name-desc', label: 'Name: Z to A' },
                  { value: 'registration', label: 'Registration number' },
                ]}
              />
            </div>
          </div>
          <div className="mt-5">
            <DataTable minWidth="52rem">
              <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Class / course</th>
                  <th className="px-4 py-3 font-semibold">Campus</th>
                  <th className="px-4 py-3 font-semibold">Registration</th>
                  <th className="px-4 py-3 font-semibold">Guardian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.isLoading ? (
                  <TableEmpty colSpan={5}>Loading students...</TableEmpty>
                ) : null}
                {!students.isLoading && filteredStudents.length === 0 ? (
                  <TableEmpty colSpan={5}>
                    No students match this view. Approved admissions will appear here automatically.
                  </TableEmpty>
                ) : null}
                {paginatedStudents.map((item) => {
                  const student = item as Student;
                  const offering = String(
                    student.academicOffering?.schoolClass?.name ??
                      student.academicOffering?.course?.name ??
                      'Offering not available',
                  );
                  return (
                    <tr
                      key={student.id}
                      className="cursor-pointer transition hover:bg-teal-50/60"
                      onClick={() => setSelectedId(student.id)}
                    >
                      <td className="px-4 py-3 font-medium">{String(student.studentFullName)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{offering}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(student.branch?.name ?? 'Campus')}
                      </td>
                      <td className="px-4 py-3 font-medium text-teal-700">
                        {String(student.registrationNumber ?? 'Registration pending')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(student.guardianFullName)} · {String(student.guardianContactNumber)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <div className="mt-4">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                itemCount={filteredStudents.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
          <div className="hidden">
            {students.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading students...</p>
            ) : null}
            {!students.isLoading && filteredStudents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No students match this view. Approved admissions will appear here automatically.
              </p>
            ) : null}
            {filteredStudents.map((item) => (
              <StudentRow
                key={item.id}
                student={item as Student}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === 'record' ? (
        <section
          role="tabpanel"
          id="record-panel"
          aria-labelledby="record-tab"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <StudentRecord
            student={selected.data as Student | undefined}
            isLoading={selected.isLoading}
            onBack={() => setActiveTab('directory')}
            onDeleted={() => {
              setSelectedId(null);
              students.refetch();
              setActiveTab('directory');
            }}
          />
        </section>
      ) : null}
      {activeTab === 'enroll' ? (
        <div className="space-y-6">
          <DirectEnrollment
            onCreated={(studentId) => {
              setSelectedId(studentId);
            }}
          />
          <BulkStudentImport onImported={() => students.refetch()} />
        </div>
      ) : null}
    </div>
  );
}

function StudentRow({ student, onOpen }: { student: Student; onOpen: () => void }) {
  const offering = String(
    student.academicOffering?.schoolClass?.name ??
      student.academicOffering?.course?.name ??
      'Offering not available',
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-teal-400 hover:bg-teal-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      <div>
        <p className="font-medium">{String(student.studentFullName)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {offering} · {String(student.branch?.name ?? 'Campus')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-teal-700">
          {String(student.registrationNumber ?? 'Registration pending')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {String(student.guardianFullName)} · {String(student.guardianContactNumber)}
        </p>
      </div>
    </button>
  );
}

function StudentRecord({
  student,
  isLoading,
  onBack,
  onDeleted,
}: {
  student?: Student;
  isLoading: boolean;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [remove, { isLoading: isDeleting }] = useDeleteStudentMutation();
  const [resetGuardian, { isLoading: isResettingGuardian }] = useResetGuardianCredentialsMutation();
  const [guardianCredential, setGuardianCredential] = useState<{
    contactNumber: string;
    temporaryPassword: string;
  } | null>(null);
  const toast = useToast();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading student record...</p>;
  if (!student)
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">Choose a student from the directory.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Their admission, guardian, and current learning placement will appear here.
        </p>
        <button type="button" className="button-primary mt-4" onClick={onBack}>
          Open directory
        </button>
      </div>
    );
  const currentStudent = student;
  const offering = String(
    student.academicOffering?.schoolClass?.name ??
      student.academicOffering?.course?.name ??
      'Not assigned',
  );
  const groupName = currentStudent.academicOffering?.academicGroup?.name;
  const group = groupName ? ` · ${String(groupName)}` : '';
  async function deleteStudent() {
    if (!window.confirm(`Delete ${String(currentStudent.studentFullName)}? This cannot be undone.`))
      return;
    try {
      await remove(currentStudent.id).unwrap();
      toast.success('Student deleted.');
      onDeleted();
    } catch {
      toast.error('Student could not be deleted.');
    }
  }
  async function resetCredentials() {
    if (
      !window.confirm(
        'Reset the shared guardian portal password? Every linked student uses this same guardian account.',
      )
    )
      return;
    try {
      const credentials = await resetGuardian(currentStudent.id).unwrap();
      setGuardianCredential(credentials);
      toast.success('Temporary guardian password created.');
    } catch {
      toast.error('Guardian credentials could not be reset.');
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Student record</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-.04em]">
            {String(student.studentFullName)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Registration:{' '}
            <strong className="text-foreground">
              {String(student.registrationNumber ?? 'Pending')}
            </strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="button-secondary" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 inline" size={14} />
            {editing ? 'Close editor' : 'Edit student'}
          </button>
          <button
            type="button"
            className="button-secondary text-rose-700 hover:text-rose-800 dark:text-rose-300"
            disabled={isDeleting}
            onClick={deleteStudent}
          >
            <Trash2 className="mr-1 inline" size={14} />
            {isDeleting ? 'Deleting...' : 'Delete student'}
          </button>
          <button
            type="button"
            className="button-secondary inline-flex items-center gap-1"
            disabled={isResettingGuardian}
            onClick={resetCredentials}
          >
            <KeyRound size={14} />
            {isResettingGuardian ? 'Resetting...' : 'Reset guardian login'}
          </button>
          <button type="button" className="button-secondary" onClick={onBack}>
            Back to directory
          </button>
        </div>
      </div>
      {editing ? (
        <StudentEditForm student={student} onSaved={() => setEditing(false)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <RecordCard
            title="Academic placement"
            lines={[
              `${String(student.branch?.name ?? 'Campus')}`,
              `${offering}${group}`,
              `Academic term: ${String(student.academicTerm?.name ?? 'Not set')}`,
            ]}
          />
          <RecordCard
            title="Guardian"
            lines={[
              String(student.guardianFullName),
              String(student.guardianContactNumber),
              `CNIC: ${String(student.studentCnic)}`,
            ]}
          />
          <RecordCard
            title="Admission"
            lines={[
              `Approved from application ${String(student.admissionApplication?.id ?? '')}`,
              `Previous school: ${String(student.previousSchool ?? 'Not provided')}`,
              `Previous performance: ${String(student.previousPerformance ?? 'Not provided')}`,
            ]}
          />
          <RecordCard
            title="Fee setup"
            lines={[
              `Monthly fee: PKR ${String(student.monthlyFeeAmount ?? 'Not set')}`,
              `Opening balance: PKR ${String(student.openingBalanceAmount ?? '0')}`,
              `Balance due: ${String(student.balanceDueOn ?? 'Not set').slice(0, 10)}`,
            ]}
          />
        </div>
      )}
      {guardianCredential ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Share these temporary guardian credentials now</p>
          <p className="mt-2">
            Contact: <strong>{guardianCredential.contactNumber}</strong>
          </p>
          <p>
            Password: <strong>{guardianCredential.temporaryPassword}</strong>
          </p>
          <p className="mt-2 text-xs">The guardian must set a new password after signing in.</p>
        </div>
      ) : null}
    </div>
  );
}

function StudentEditForm({ student, onSaved }: { student: Student; onSaved: () => void }) {
  const [update, { isLoading }] = useUpdateStudentMutation();
  const toast = useToast();
  const { data: branches = [] } = useListBranchesQuery();
  const [targetBranchId, setTargetBranchId] = useState(String(student.branchId));
  const { data: offerings = [] } = useListOfferingsQuery(targetBranchId || skipToken);
  const { data: academicTerms = [] } = useListAcademicTermsQuery();
  const [form, setForm] = useState({
    studentFullName: String(student.studentFullName),
    studentCnic: String(student.studentCnic),
    previousSchool: String(student.previousSchool ?? ''),
    previousPerformance: String(student.previousPerformance ?? ''),
    academicOfferingId: String(student.academicOfferingId),
    academicTermId: String(student.academicTermId),
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update({ studentId: student.id, body: form }).unwrap();
      toast.success('Student details updated.');
      onSaved();
    } catch {
      toast.error('Student details could not be updated. CNIC must be unique within the offering.');
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-2"
    >
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
        CNIC / B-Form
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
        Previous school
        <input
          className="field"
          value={form.previousSchool}
          onChange={(event) => setForm({ ...form, previousSchool: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Previous performance
        <input
          className="field"
          value={form.previousPerformance}
          onChange={(event) => setForm({ ...form, previousPerformance: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Campus
        <select
          className="field"
          required
          value={targetBranchId}
          onChange={(event) => {
            setTargetBranchId(event.target.value);
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
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Class or course
        <select
          className="field"
          required
          value={form.academicOfferingId}
          onChange={(event) => setForm({ ...form, academicOfferingId: event.target.value })}
        >
          <option value="">Select class or course</option>
          {offerings.map((offering) => (
            <option key={offering.id} value={offering.id}>
              {String(
                (offering.schoolClass as ApiRecord | undefined)?.name ??
                  (offering.course as ApiRecord | undefined)?.name ??
                  offering.offeringKey,
              )}
              {offering.sectionName ? ` - ${String(offering.sectionName)}` : ''}
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
          <option value="">Select academic term</option>
          {academicTerms.map((term) => (
            <option key={term.id} value={term.id}>
              {String(term.name)}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-lg bg-background p-3 text-sm text-muted-foreground md:col-span-2">
        Changing the class or campus safely moves this student to that active offering. Guardian
        contact is managed separately to avoid breaking learner access for siblings.
      </div>
      <button className="button-primary w-fit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save student details'}
      </button>
    </form>
  );
}

function RecordCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article className="rounded-xl border border-border bg-muted/30 p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}
