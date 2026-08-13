'use client';

import { FormEvent, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CreditCard, Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListStudentsQuery } from '@web/features/students/students.api';
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetStudentFinanceQuery,
  useUpdatePaymentMutation,
} from '../finance.api';
import type { ApiRecord } from '@web/store/api/base-api';

const today = new Date().toISOString().slice(0, 10);

export function FinanceManagement() {
  const [tab, setTab] = useState<'summary' | 'payment'>('summary');
  const [branchId, setBranchId] = useState('');
  const [studentId, setStudentId] = useState('');
  const { data: branches = [] } = useListBranchesQuery();
  const { data: students = [] } = useListStudentsQuery(branchId ? { branchId } : undefined);
  const summary = useGetStudentFinanceQuery(studentId || skipToken);
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Fees and payments</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Review each student’s opening balance and recorded payments, then issue a receipt for
          every amount received.
        </p>
      </header>
      <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'summary'}
          onClick={() => setTab('summary')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'summary' ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <ReceiptText size={16} />
          Fee summary
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'payment'}
          onClick={() => setTab('payment')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'payment' ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <CreditCard size={16} />
          Record payment
        </button>
      </div>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
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
              <option value="">Select a campus</option>
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
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {String(student.studentFullName)} · {String(student.registrationNumber ?? '')}
                </option>
              ))}
            </select>
          </label>
        </div>
        {studentId && tab === 'summary' ? (
          <FinanceSummary summary={summary.data} isLoading={summary.isLoading} />
        ) : null}
        {studentId && tab === 'payment' ? <PaymentForm studentId={studentId} /> : null}
        {!studentId ? (
          <p className="text-sm text-muted-foreground">
            Choose a campus and student to view or update their fee record.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function FinanceSummary({ summary, isLoading }: { summary?: ApiRecord; isLoading: boolean }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading fee summary...</p>;
  if (!summary) return null;
  const amount = (value: unknown) =>
    `PKR ${Number(value ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  const payments = Array.isArray(summary.payments) ? (summary.payments as ApiRecord[]) : [];
  const filteredPayments = payments.filter((payment) =>
    `${String(payment.receiptNumber)} ${String(payment.remarks ?? '')}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <FinanceCard label="Monthly fee" value={amount(summary.monthlyFeeAmount)} />
        <FinanceCard label="Total received" value={amount(summary.paid)} />
        <FinanceCard
          label="Opening balance"
          value={amount(summary.openingBalanceAmount)}
          emphasis
        />
        <FinanceCard label="Remaining balance" value={amount(summary.balance)} emphasis />
      </div>
      <div>
        <h2 className="font-display text-2xl">Payment history</h2>
        <div className="mt-3">
          <DataTableControls
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search receipt or remarks"
            sortValue="received"
            onSortChange={() => undefined}
            sortOptions={[{ value: 'received', label: 'Newest first' }]}
          />
        </div>
        <DataTable minWidth="36rem">
          <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Receipt</th>
              <th className="px-4 py-3 font-semibold">Received on</th>
              <th className="px-4 py-3 font-semibold">Remarks</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? (
              <TableEmpty colSpan={5}>
                No payments recorded beyond the amount received with the admission form.
              </TableEmpty>
            ) : (
              paginatedPayments.map((payment) =>
                editingId === payment.id ? (
                  <PaymentEditor
                    key={payment.id}
                    payment={payment}
                    onClose={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-medium">{String(payment.receiptNumber)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {String(payment.receivedOn).slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {String(payment.remarks ?? 'No remarks')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{amount(payment.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <PaymentActions payment={payment} onEdit={() => setEditingId(payment.id)} />
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </DataTable>
        <div className="mt-4">
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            itemCount={filteredPayments.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
        <div className="hidden">
          {payments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No payments recorded beyond the amount received with the admission form.
            </p>
          ) : (
            payments.map((payment) => (
              <article
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-medium">Receipt {String(payment.receiptNumber)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(payment.receivedOn).slice(0, 10)} ·{' '}
                    {String(payment.remarks ?? 'No remarks')}
                  </p>
                </div>
                <strong>{amount(payment.amount)}</strong>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
function PaymentActions({ payment, onEdit }: { payment: ApiRecord; onEdit: () => void }) {
  const [remove, { isLoading }] = useDeletePaymentMutation();
  const toast = useToast();
  async function deletePayment() {
    if (!window.confirm(`Delete receipt ${String(payment.receiptNumber)}?`)) return;
    try {
      await remove({ studentId: String(payment.studentId), paymentId: payment.id }).unwrap();
      toast.success('Payment deleted.');
    } catch {
      toast.error('Payment could not be deleted.');
    }
  }
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        onClick={onEdit}
      >
        <Pencil size={14} /> Edit
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
        disabled={isLoading}
        onClick={deletePayment}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
function PaymentEditor({ payment, onClose }: { payment: ApiRecord; onClose: () => void }) {
  const [update, { isLoading }] = useUpdatePaymentMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    amount: String(payment.amount),
    receiptNumber: String(payment.receiptNumber),
    receivedOn: String(payment.receivedOn).slice(0, 10),
    remarks: String(payment.remarks ?? ''),
  });
  async function save() {
    try {
      await update({
        studentId: String(payment.studentId),
        paymentId: payment.id,
        amount: Number(form.amount),
        receiptNumber: form.receiptNumber,
        receivedOn: form.receivedOn,
        remarks: form.remarks,
      }).unwrap();
      toast.success('Payment updated.');
      onClose();
    } catch {
      toast.error('Payment could not be updated.');
    }
  }
  return (
    <tr className="bg-muted/40">
      <td className="px-4 py-3">
        <input
          className="field"
          value={form.receiptNumber}
          onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="field"
          type="date"
          value={form.receivedOn}
          onChange={(e) => setForm({ ...form, receivedOn: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="field"
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="field text-right"
          type="number"
          min="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button type="button" className="button-primary" disabled={isLoading} onClick={save}>
            Save
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
function FinanceCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${emphasis ? 'border-teal-300 bg-teal-50/60' : 'border-border bg-muted/30'}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </article>
  );
}
function PaymentForm({ studentId }: { studentId: string }) {
  const [create, { isLoading }] = useCreatePaymentMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    amount: '',
    receiptNumber: '',
    receivedOn: today,
    remarks: '',
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create({
        studentId,
        amount: Number(form.amount),
        receiptNumber: form.receiptNumber,
        receivedOn: form.receivedOn,
        remarks: form.remarks || undefined,
      }).unwrap();
      setForm({ amount: '', receiptNumber: '', receivedOn: today, remarks: '' });
      toast.success('Payment recorded and receipt number saved.');
    } catch {
      toast.error('Payment could not be recorded. Receipt numbers must be unique.');
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Amount (PKR)
        <input
          className="field"
          required
          min="0.01"
          step="0.01"
          type="number"
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Receipt number
        <input
          className="field"
          required
          value={form.receiptNumber}
          onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Received on
        <input
          className="field"
          required
          type="date"
          value={form.receivedOn}
          onChange={(event) => setForm({ ...form, receivedOn: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Remarks <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          className="field"
          value={form.remarks}
          onChange={(event) => setForm({ ...form, remarks: event.target.value })}
        />
      </label>
      <button className="button-primary w-fit" disabled={isLoading}>
        {isLoading ? 'Recording...' : 'Record payment'}
      </button>
    </form>
  );
}
