'use client';

import Link from 'next/link';
import { useGetPublicWebsiteQuery, type WebsiteSettings } from './website.api';
import { websiteTheme } from './website-theme';

export function WebsiteSurface({
  settings,
  preview = false,
}: {
  settings: WebsiteSettings;
  preview?: boolean;
}) {
  return (
    <div
      className={`website-public website-template-${settings.template.toLowerCase()}`}
      style={websiteTheme(settings)}
    >
      {preview ? <div className="website-preview-banner">Draft preview · not public</div> : null}
      <header className="website-public-header">
        <Link href={preview ? '/dashboard/website' : '/'} className="website-wordmark">
          {settings.schoolName}
        </Link>
      </header>
      <main className="website-foundation-hero">
        <div className="website-foundation-copy">
          <h1>{settings.schoolName}</h1>
          {settings.tagline ? <p>{settings.tagline}</p> : null}
        </div>
        <div className="website-foundation-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </main>
      <footer className="website-public-footer">
        <span>{settings.schoolName}</span>
        <Link href="/login">Staff Portal</Link>
      </footer>
    </div>
  );
}

export function PublicWebsitePage() {
  const { data, isLoading, isError } = useGetPublicWebsiteQuery();
  if (isLoading) return <main className="website-public-state">Loading website…</main>;
  if (isError || !data)
    return (
      <main className="website-public-state">
        <h1>Our website is being prepared.</h1>
        <p>Please check back soon.</p>
        <Link href="/login">Staff Portal</Link>
      </main>
    );
  return <WebsiteSurface settings={data.data} />;
}
