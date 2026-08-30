'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Globe2, Save, Send } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import {
  type WebsiteSettings,
  type WebsiteTemplate,
  useGetWebsiteOverviewQuery,
  usePublishWebsiteMutation,
  useSaveWebsiteDraftMutation,
} from './website.api';

const fallback: WebsiteSettings = {
  schoolName: '',
  template: 'CLASSIC',
  primaryColor: '#740019',
  secondaryColor: '#F4C95D',
  accentColor: '#0F766E',
};

export function WebsiteManager() {
  const toast = useToast();
  const overview = useGetWebsiteOverviewQuery();
  const [settings, setSettings] = useState(fallback);
  const [saveDraft, saveState] = useSaveWebsiteDraftMutation();
  const [publish, publishState] = usePublishWebsiteMutation();
  useEffect(() => {
    if (overview.data?.draft) setSettings(overview.data.draft.data);
  }, [overview.data?.draft]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings.schoolName.trim()) return toast.error('Enter the public school name.');
    try {
      await saveDraft(settings).unwrap();
      toast.success('Website draft saved.');
    } catch {
      toast.error('The website draft could not be saved. Check the settings and try again.');
    }
  }

  async function publishDraft() {
    try {
      await publish().unwrap();
      toast.success('Website changes published.');
    } catch {
      toast.error('The website could not be published. Save the draft and try again.');
    }
  }

  if (overview.isLoading)
    return <p className="text-sm text-muted-foreground">Loading Website Manager…</p>;
  if (overview.isError || !overview.data)
    return (
      <p className="text-sm text-destructive">
        Website Manager could not be loaded. Refresh and try again.
      </p>
    );

  const published = overview.data.published;
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-[-.04em]">Website Manager</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Shape the public school website, preview the draft, then publish when it is ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/website/preview"
            className="button-secondary inline-flex items-center gap-2"
          >
            <ExternalLink size={16} /> Preview draft
          </Link>
          <button
            className="button-primary inline-flex items-center gap-2"
            disabled={publishState.isLoading || !overview.data.hasUnpublishedChanges}
            onClick={publishDraft}
          >
            <Send size={16} /> {publishState.isLoading ? 'Publishing…' : 'Publish changes'}
          </button>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Website status</p>
          <p className="mt-1 font-semibold">
            {overview.data.status === 'PUBLISHED' ? 'Published' : 'Not published'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Template</p>
          <p className="mt-1 font-semibold">
            {settings.template[0] + settings.template.slice(1).toLowerCase()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Draft state</p>
          <p className="mt-1 font-semibold">
            {overview.data.hasUnpublishedChanges ? 'Unpublished changes' : 'Up to date'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last published</p>
          <p className="mt-1 font-semibold">
            {published?.publishedAt
              ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(
                  new Date(published.publishedAt),
                )
              : 'Never'}
          </p>
          {published?.publishedBy ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              by {published.publishedBy.fullName}
            </p>
          ) : null}
        </div>
      </section>

      <form
        className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
        onSubmit={submit}
      >
        <div className="flex items-center gap-3">
          <Globe2 className="text-teal-600" size={22} />
          <div>
            <h2 className="font-display text-2xl">Foundation settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These values power both preview and the published homepage.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            School name
            <input
              className="field"
              maxLength={160}
              value={settings.schoolName}
              onChange={(event) => setSettings({ ...settings, schoolName: event.target.value })}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Tagline
            <input
              className="field"
              maxLength={240}
              placeholder="Optional"
              value={settings.tagline ?? ''}
              onChange={(event) => setSettings({ ...settings, tagline: event.target.value })}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Template
            <select
              className="field"
              value={settings.template}
              onChange={(event) =>
                setSettings({ ...settings, template: event.target.value as WebsiteTemplate })
              }
            >
              <option value="CLASSIC">Classic</option>
              <option value="MODERN">Modern</option>
              <option value="MINIMAL">Minimal</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
              <label key={key} className="grid gap-1.5 text-xs font-medium capitalize">
                {key.replace('Color', '')}
                <input
                  aria-label={key.replace('Color', ' color')}
                  className="field h-12 p-1"
                  type="color"
                  value={settings[key]}
                  onChange={(event) => setSettings({ ...settings, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        </div>
        <button
          className="button-primary inline-flex items-center gap-2"
          disabled={saveState.isLoading}
        >
          <Save size={16} /> {saveState.isLoading ? 'Saving…' : 'Save draft'}
        </button>
      </form>
    </div>
  );
}
