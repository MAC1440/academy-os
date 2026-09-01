'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useGetPublicWebsiteQuery, type WebsiteSettings } from './website.api';
import { websiteTheme } from './website-theme';

function Brand({ settings, preview }: { settings: WebsiteSettings; preview: boolean }) {
  return (
    <Link href={preview ? '/dashboard/website' : '/'} className="website-wordmark">
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt={`${settings.schoolName} logo`} />
      ) : (
        <span className="website-lettermark" aria-hidden="true">
          {settings.schoolName.charAt(0)}
        </span>
      )}
      <span>{settings.schoolName}</span>
    </Link>
  );
}

function TemplateArtwork({ template }: { template: WebsiteSettings['template'] }) {
  if (template === 'MINIMAL')
    return (
      <div className="website-minimal-rule" aria-hidden="true">
        <span />
        <span />
      </div>
    );
  return (
    <div className="website-foundation-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function PublicFooter({ settings }: { settings: WebsiteSettings }) {
  const socials = [
    { href: settings.facebookUrl, label: 'Facebook' },
    { href: settings.instagramUrl, label: 'Instagram' },
    { href: settings.youtubeUrl, label: 'YouTube' },
  ].filter((item) => item.href);
  return (
    <footer className="website-public-footer">
      <div>
        <strong>{settings.schoolName}</strong>
        {settings.address ? <span>{settings.address}</span> : null}
      </div>
      <div className="website-footer-contact">
        {settings.contactEmail ? (
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        ) : null}
        {settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : null}
      </div>
      {socials.length ? (
        <nav aria-label="Social media">
          {socials.map((social) => (
            <a key={social.label} href={social.href} rel="noreferrer" target="_blank">
              {social.label}
            </a>
          ))}
        </nav>
      ) : null}
      <Link href="/login" className="website-portal-link">
        Staff Portal
      </Link>
    </footer>
  );
}

export function WebsiteSurface({
  settings,
  preview = false,
}: {
  settings: WebsiteSettings;
  preview?: boolean;
}) {
  useEffect(() => {
    if (!settings.faviconUrl) return;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = settings.faviconUrl;
  }, [settings.faviconUrl]);

  return (
    <div
      className={`website-public website-template-${settings.template.toLowerCase()}`}
      style={websiteTheme(settings)}
    >
      {preview ? (
        <div className="website-preview-banner">
          Draft preview · only visible to signed-in staff
        </div>
      ) : null}
      <header className="website-public-header">
        <Brand settings={settings} preview={preview} />
        <nav aria-label="Primary navigation">
          <a href="#welcome">Welcome</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main id="welcome" className="website-foundation-hero">
        <div className="website-foundation-copy">
          <h1>{settings.schoolName}</h1>
          {settings.tagline ? <p>{settings.tagline}</p> : null}
          <a href="#contact" className="website-public-action">
            Contact our school
          </a>
        </div>
        <TemplateArtwork template={settings.template} />
      </main>
      <div id="contact">
        <PublicFooter settings={settings} />
      </div>
    </div>
  );
}

export function PublicWebsitePage() {
  const { data, isLoading, isError } = useGetPublicWebsiteQuery();
  if (isLoading)
    return (
      <main className="website-public-state" aria-live="polite">
        Loading website…
      </main>
    );
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
