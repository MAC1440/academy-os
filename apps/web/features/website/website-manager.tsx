'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Globe2, ImageIcon, Palette, Save, Send, Type } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { WebsiteContentManager } from './website-content-manager';
import { WebsitePublishingStudio } from './website-publishing-studio';
import { WebsiteAdmissionsManager } from './website-admissions-manager';
import {
  type WebsiteFont,
  type WebsiteSettings,
  type WebsiteTemplate,
  useGetWebsiteOverviewQuery,
  usePublishWebsiteMutation,
  useSaveWebsiteDraftMutation,
} from './website.api';

const fonts: WebsiteFont[] = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Merriweather',
];
const fallback: WebsiteSettings = {
  schoolName: '',
  template: 'CLASSIC',
  primaryColor: '#740019',
  secondaryColor: '#F4C95D',
  accentColor: '#0F766E',
  headingFont: 'Merriweather',
  bodyFont: 'Inter',
  homepage: {
    hero: { enabled: true, title: '' },
    introduction: { enabled: false, heading: 'Welcome to our school', content: '' },
    principalMessage: { enabled: false },
    programs: { enabled: false },
    facilities: { enabled: false },
    faculty: { enabled: false },
    contact: { enabled: true },
  },
  programs: [],
  facilities: [],
  faculty: [],
  admissions: {
    enabled: false,
    isOpen: false,
    heading: 'Admissions',
    description: '',
    eligibleOfferingIds: [],
    confirmationMessage: 'Thank you. Your application has been received.',
  },
};
const templates: Array<{ value: WebsiteTemplate; name: string; description: string }> = [
  { value: 'CLASSIC', name: 'Classic', description: 'Formal, balanced and welcoming.' },
  { value: 'MODERN', name: 'Modern', description: 'Bold geometry and confident scale.' },
  { value: 'MINIMAL', name: 'Minimal', description: 'Quiet, spacious and content-led.' },
];

function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="website-manager-section">
      <div className="website-manager-section-copy">
        <span className="website-manager-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="website-manager-fields">{children}</div>
    </section>
  );
}

export function WebsiteManager() {
  const toast = useToast();
  const overview = useGetWebsiteOverviewQuery();
  const [settings, setSettings] = useState(fallback);
  const [saveDraft, saveState] = useSaveWebsiteDraftMutation();
  const [publish, publishState] = usePublishWebsiteMutation();
  useEffect(() => {
    if (!overview.data?.draft) return;
    const draft = overview.data.draft.data;
    setSettings({
      ...fallback,
      ...draft,
      homepage: { ...fallback.homepage, ...draft.homepage },
      programs: draft.programs ?? [],
      facilities: draft.facilities ?? [],
      faculty: draft.faculty ?? [],
      admissions: { ...fallback.admissions, ...draft.admissions },
    });
  }, [overview.data?.draft]);
  const update = <K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings.schoolName.trim()) return toast.error('Enter the public school name.');
    const optionalFields: Array<
      | 'tagline'
      | 'logoUrl'
      | 'faviconUrl'
      | 'contactEmail'
      | 'phone'
      | 'address'
      | 'facebookUrl'
      | 'instagramUrl'
      | 'youtubeUrl'
    > = [
      'tagline',
      'logoUrl',
      'faviconUrl',
      'contactEmail',
      'phone',
      'address',
      'facebookUrl',
      'instagramUrl',
      'youtubeUrl',
    ];
    const payload = { ...settings };
    optionalFields.forEach((key) => {
      if (!String(payload[key] ?? '').trim()) delete payload[key];
    });
    try {
      await saveDraft(payload).unwrap();
      toast.success('Branding draft saved. Preview it before publishing.');
    } catch {
      toast.error('The branding draft could not be saved. Check URLs and contact details.');
    }
  }
  async function publishDraft() {
    try {
      await publish().unwrap();
      toast.success('Website branding published.');
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
    <div className="space-y-10">
      <form className="website-manager space-y-7" onSubmit={submit}>
        <header className="website-manager-header">
          <div>
            <h1>Website branding</h1>
            <p>Build a recognizable public identity without changing the AcademyOS portal theme.</p>
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
              type="button"
            >
              <Send size={16} /> {publishState.isLoading ? 'Publishing…' : 'Publish changes'}
            </button>
          </div>
        </header>

        <section className="website-manager-status" aria-label="Website status">
          <div>
            <span>Website</span>
            <strong>{overview.data.status === 'PUBLISHED' ? 'Published' : 'Not published'}</strong>
          </div>
          <div>
            <span>Draft</span>
            <strong>
              {overview.data.hasUnpublishedChanges ? 'Changes waiting' : 'Up to date'}
            </strong>
          </div>
          <div>
            <span>Template</span>
            <strong>{templates.find((item) => item.value === settings.template)?.name}</strong>
          </div>
          <div>
            <span>Last published</span>
            <strong>
              {published?.publishedAt
                ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(
                    new Date(published.publishedAt),
                  )
                : 'Never'}
            </strong>
            {published?.publishedBy ? <small>by {published.publishedBy.fullName}</small> : null}
          </div>
        </section>

        <SettingSection
          icon={<Globe2 size={20} />}
          title="Identity"
          description="The name and signature line visitors see first."
        >
          <label className="grid gap-1.5 text-sm font-medium">
            School name
            <input
              className="field"
              maxLength={160}
              required
              value={settings.schoolName}
              onChange={(event) => update('schoolName', event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Tagline
            <input
              className="field"
              maxLength={240}
              placeholder="A short statement about your school"
              value={settings.tagline ?? ''}
              onChange={(event) => update('tagline', event.target.value)}
            />
          </label>
        </SettingSection>

        <SettingSection
          icon={<ImageIcon size={20} />}
          title="Brand assets"
          description="Use public HTTPS image URLs now; uploads arrive with the Media Library."
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Logo URL
            <input
              className="field"
              inputMode="url"
              placeholder="https://…/logo.png"
              type="url"
              value={settings.logoUrl ?? ''}
              onChange={(event) => update('logoUrl', event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Favicon URL
            <input
              className="field"
              inputMode="url"
              placeholder="https://…/favicon.png"
              type="url"
              value={settings.faviconUrl ?? ''}
              onChange={(event) => update('faviconUrl', event.target.value)}
            />
          </label>
        </SettingSection>

        <SettingSection
          icon={<Palette size={20} />}
          title="Template and color"
          description="Templates reshape the same content. Switching never removes what you entered."
        >
          <fieldset className="website-template-picker md:col-span-2">
            <legend className="sr-only">Website template</legend>
            {templates.map((template) => (
              <label key={template.value} className="website-template-option">
                <input
                  type="radio"
                  name="template"
                  checked={settings.template === template.value}
                  onChange={() => update('template', template.value)}
                />
                <span
                  className={`website-template-swatch website-template-swatch-${template.value.toLowerCase()}`}
                  style={
                    {
                      '--swatch-primary': settings.primaryColor,
                      '--swatch-secondary': settings.secondaryColor,
                    } as React.CSSProperties
                  }
                >
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </label>
            ))}
          </fieldset>
          <div className="website-color-fields md:col-span-2">
            {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
              <label key={key}>
                <span>{key.replace('Color', '')}</span>
                <div>
                  <input
                    aria-label={`${key.replace('Color', '')} color picker`}
                    type="color"
                    value={settings[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                  <input
                    aria-label={`${key.replace('Color', '')} hex value`}
                    className="field"
                    maxLength={7}
                    pattern="#[0-9A-Fa-f]{6}"
                    value={settings[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                </div>
              </label>
            ))}
          </div>
        </SettingSection>

        <SettingSection
          icon={<Type size={20} />}
          title="Typography"
          description="Choose readable, controlled typefaces for headings and body copy."
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Heading font
            <select
              className="field"
              value={settings.headingFont}
              onChange={(event) => update('headingFont', event.target.value as WebsiteFont)}
            >
              {fonts.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Body font
            <select
              className="field"
              value={settings.bodyFont}
              onChange={(event) => update('bodyFont', event.target.value as WebsiteFont)}
            >
              {fonts.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>
        </SettingSection>

        <SettingSection
          icon={<Globe2 size={20} />}
          title="Contact and social"
          description="Optional public details shown in the website footer."
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Contact email
            <input
              className="field"
              type="email"
              maxLength={160}
              placeholder="info@school.edu.pk"
              value={settings.contactEmail ?? ''}
              onChange={(event) => update('contactEmail', event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Phone
            <input
              className="field"
              type="tel"
              maxLength={40}
              placeholder="+92 300 1234567"
              value={settings.phone ?? ''}
              onChange={(event) => update('phone', event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
            Main address
            <textarea
              className="field min-h-24 resize-y"
              maxLength={500}
              value={settings.address ?? ''}
              onChange={(event) => update('address', event.target.value)}
            />
          </label>
          {(['facebookUrl', 'instagramUrl', 'youtubeUrl'] as const).map((key) => (
            <label key={key} className="grid gap-1.5 text-sm font-medium capitalize">
              {key.replace('Url', '')}
              <input
                className="field"
                type="url"
                placeholder="https://…"
                value={settings[key] ?? ''}
                onChange={(event) => update(key, event.target.value)}
              />
            </label>
          ))}
        </SettingSection>

        <WebsiteContentManager settings={settings} onChange={setSettings} />
        <WebsiteAdmissionsManager settings={settings} onChange={setSettings} />

        <div className="website-manager-savebar">
          <p>Your edits stay private until you publish them.</p>
          <button
            className="button-primary inline-flex items-center gap-2"
            disabled={saveState.isLoading}
          >
            <Save size={16} /> {saveState.isLoading ? 'Saving…' : 'Save website draft'}
          </button>
        </div>
      </form>
      <WebsitePublishingStudio />
    </div>
  );
}
