'use client';
import { Search } from 'lucide-react';
import type { WebsiteSettings } from './website.api';
export function WebsiteSeoManager({
  settings,
  onChange,
}: {
  settings: WebsiteSettings;
  onChange: (value: WebsiteSettings) => void;
}) {
  const update = (value: Partial<WebsiteSettings['seo']>) =>
    onChange({ ...settings, seo: { ...settings.seo, ...value } });
  return (
    <section className="website-manager-section">
      <div className="website-manager-section-copy">
        <span className="website-manager-section-icon">
          <Search size={20} />
        </span>
        <div>
          <h2>Search and sharing</h2>
          <p>
            Control the default title, description, and image shown by search engines and social
            platforms.
          </p>
        </div>
      </div>
      <div className="website-manager-fields">
        <label className="grid gap-1.5 text-sm font-medium">
          Default page title
          <input
            className="field"
            maxLength={160}
            value={settings.seo.defaultTitle}
            onChange={(event) => update({ defaultTitle: event.target.value })}
          />
          <small className="text-muted-foreground">{settings.seo.defaultTitle.length}/160</small>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Social image URL
          <input
            className="field"
            type="url"
            placeholder="https://…"
            value={settings.seo.defaultSocialImage || ''}
            onChange={(event) => update({ defaultSocialImage: event.target.value || undefined })}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
          Default description
          <textarea
            className="field min-h-24"
            maxLength={320}
            value={settings.seo.defaultDescription}
            onChange={(event) => update({ defaultDescription: event.target.value })}
          />
          <small className="text-muted-foreground">
            Aim for a clear 120–160 character summary. {settings.seo.defaultDescription.length}/320
          </small>
        </label>
        <div className="website-search-preview md:col-span-2">
          <span>Search preview</span>
          <strong>{settings.seo.defaultTitle || settings.schoolName}</strong>
          <p>
            {settings.seo.defaultDescription ||
              'Add a description to help families understand this website before they visit.'}
          </p>
        </div>
      </div>
    </section>
  );
}
