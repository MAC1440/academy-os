'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useListAnnouncementsQuery,
  useUpdateAnnouncementMutation,
} from './announcements.api';

type FormState = {
  title: string;
  content: string;
  audience: 'ALL' | 'LEARNER' | 'STAFF';
  eventDate: string;
};
const blankForm: FormState = { title: '', content: '', audience: 'ALL', eventDate: '' };

export function AnnouncementsManagement() {
  const { data: announcements = [], isLoading, refetch } = useListAnnouncementsQuery();
  const [create] = useCreateAnnouncementMutation();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      announcements.filter((item) =>
        `${item.title} ${item.content} ${item.audience}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [announcements, search],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create({ ...form, eventDate: form.eventDate || undefined }).unwrap();
      setForm(blankForm);
      setCreating(false);
      await refetch();
      toast.success('Announcement published.');
    } catch {
      toast.error('The announcement could not be published.');
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em]">Announcements</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Publish timely updates, events, and reminders to staff, families, or everyone.
          </p>
        </div>
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> New announcement
        </button>
      </header>
      {creating ? (
        <AnnouncementForm
          form={form}
          onChange={setForm}
          onSubmit={submit}
          onCancel={() => {
            setCreating(false);
            setForm(blankForm);
          }}
          submitLabel="Publish announcement"
        />
      ) : null}
      {!isLoading && announcements.length ? (
        <label className="relative block max-w-lg">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            className="field pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements"
          />
        </label>
      ) : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading announcements...</p> : null}
      {!isLoading && !announcements.length ? (
        <section className="max-w-xl py-10">
          <h2 className="font-display text-2xl">Keep your community in the loop.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create your first announcement for a holiday, event, staff update, or parent reminder.
          </p>
          <button type="button" className="button-primary mt-5" onClick={() => setCreating(true)}>
            Create the first announcement
          </button>
        </section>
      ) : null}
      {announcements.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Announcement</th>
                <th className="px-5 py-3 font-medium">Audience</th>
                <th className="px-5 py-3 font-medium">Event date</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <AnnouncementRow key={item.id} item={item} onChanged={refetch} />
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No announcements match that search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function AnnouncementRow({ item, onChanged }: { item: ApiRecord; onChanged: () => unknown }) {
  const [editing, setEditing] = useState(false);
  const [update] = useUpdateAnnouncementMutation();
  const [remove] = useDeleteAnnouncementMutation();
  const toast = useToast();
  const [form, setForm] = useState<FormState>({
    title: String(item.title),
    content: String(item.content),
    audience: item.audience as FormState['audience'],
    eventDate: item.eventDate ? String(item.eventDate).slice(0, 10) : '',
  });
  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await update({
        id: item.id,
        body: { ...form, eventDate: form.eventDate || undefined },
      }).unwrap();
      await onChanged();
      setEditing(false);
      toast.success('Announcement updated.');
    } catch {
      toast.error('The announcement could not be updated.');
    }
  }
  async function destroy() {
    if (!window.confirm('Delete this announcement? It will no longer be visible in any portal.'))
      return;
    try {
      await remove(item.id).unwrap();
      await onChanged();
      toast.success('Announcement deleted.');
    } catch {
      toast.error('The announcement could not be deleted.');
    }
  }
  if (editing)
    return (
      <tr>
        <td colSpan={5} className="p-5">
          <AnnouncementForm
            form={form}
            onChange={setForm}
            onSubmit={save}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
            compact
          />
        </td>
      </tr>
    );
  return (
    <tr className="border-b border-border/70 last:border-0">
      <td className="max-w-xl px-5 py-4">
        <p className="font-semibold">{String(item.title)}</p>
        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-muted-foreground">
          {String(item.content)}
        </p>
      </td>
      <td className="px-5 py-4">
        <Audience value={String(item.audience)} />
      </td>
      <td className="px-5 py-4">{item.eventDate ? String(item.eventDate).slice(0, 10) : 'â€”'}</td>
      <td className="px-5 py-4 text-muted-foreground">{String(item.updatedAt).slice(0, 10)}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
            onClick={destroy}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function AnnouncementForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  compact = false,
}: {
  form: FormState;
  onChange: (value: FormState) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  compact?: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-4 rounded-2xl border border-teal-300 bg-teal-50/60 p-5 dark:bg-teal-950/20 ${compact ? '' : ''}`}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem_11rem]">
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className="field"
            required
            maxLength={140}
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="e.g. Independence Day holiday"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Audience
          <select
            className="field"
            value={form.audience}
            onChange={(event) =>
              onChange({ ...form, audience: event.target.value as FormState['audience'] })
            }
          >
            <option value="ALL">Everyone</option>
            <option value="LEARNER">Parents & students</option>
            <option value="STAFF">Staff</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Event date <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            className="field"
            type="date"
            value={form.eventDate}
            onChange={(event) => onChange({ ...form, eventDate: event.target.value })}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Message
        <textarea
          className="field min-h-32 resize-y"
          required
          maxLength={5000}
          value={form.content}
          onChange={(event) => onChange({ ...form, content: event.target.value })}
          placeholder="Write the update your audience needs to see."
        />
        <span className="text-right text-xs font-normal text-muted-foreground">
          {form.content.length}/5,000
        </span>
      </label>
      <div className="flex gap-2">
        <button className="button-primary">{submitLabel}</button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function Audience({ value }: { value: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
      {value === 'ALL' ? 'Everyone' : value === 'LEARNER' ? 'Parents & students' : 'Staff'}
    </span>
  );
}
