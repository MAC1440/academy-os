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
  const homepage = settings.homepage ?? {
    hero: { enabled: true, title: settings.schoolName },
    introduction: { enabled: false, heading: '', content: '' },
    principalMessage: { enabled: false },
    programs: { enabled: false },
    facilities: { enabled: false },
    faculty: { enabled: false },
    contact: { enabled: true },
  };
  const programs = (settings.programs ?? [])
    .filter((item) => item.visible && item.name.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const facilities = (settings.facilities ?? [])
    .filter((item) => item.visible && item.title.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const faculty = (settings.faculty ?? [])
    .filter((item) => item.visible && item.name.trim() && item.designation.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
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
          {homepage.programs.enabled && programs.length ? <a href="#programs">Programs</a> : null}
          {homepage.faculty.enabled && faculty.length ? <a href="#faculty">Faculty</a> : null}
          {homepage.contact.enabled ? <a href="#contact">Contact</a> : null}
          <Link href="/news">News</Link>
          <Link href="/events">Events</Link>
          <Link href="/gallery">Gallery</Link>
        </nav>
      </header>
      <main>
        {homepage.hero.enabled && homepage.hero.title.trim() ? (
          <section id="welcome" className="website-foundation-hero">
            <div className="website-foundation-copy">
              <h1>{homepage.hero.title}</h1>
              {homepage.hero.subtitle || settings.tagline ? (
                <p>{homepage.hero.subtitle || settings.tagline}</p>
              ) : null}
              {homepage.hero.ctaText && homepage.hero.ctaLink ? (
                <a href={homepage.hero.ctaLink} className="website-public-action">
                  {homepage.hero.ctaText}
                </a>
              ) : null}
            </div>
            {homepage.hero.imageUrl ? (
              <img className="website-hero-image" src={homepage.hero.imageUrl} alt="" />
            ) : (
              <TemplateArtwork template={settings.template} />
            )}
          </section>
        ) : null}

        {homepage.introduction.enabled &&
        homepage.introduction.heading.trim() &&
        homepage.introduction.content.trim() ? (
          <section className="website-story-section">
            <div>
              <h2>{homepage.introduction.heading}</h2>
              <p>{homepage.introduction.content}</p>
            </div>
            {homepage.introduction.imageUrl ? (
              <img src={homepage.introduction.imageUrl} alt="" />
            ) : null}
          </section>
        ) : null}

        {homepage.principalMessage.enabled &&
        homepage.principalMessage.name?.trim() &&
        homepage.principalMessage.message?.trim() ? (
          <section className="website-principal-section">
            {homepage.principalMessage.imageUrl ? (
              <img src={homepage.principalMessage.imageUrl} alt={homepage.principalMessage.name} />
            ) : (
              <div className="website-person-placeholder" aria-hidden="true">
                {homepage.principalMessage.name.charAt(0)}
              </div>
            )}
            <blockquote>
              <p>{homepage.principalMessage.message}</p>
              <footer>
                <strong>{homepage.principalMessage.name}</strong>
                {homepage.principalMessage.designation ? (
                  <span>{homepage.principalMessage.designation}</span>
                ) : null}
              </footer>
            </blockquote>
          </section>
        ) : null}

        {homepage.programs.enabled && programs.length ? (
          <PublicCollection
            id="programs"
            title="Programs"
            intro="Learning pathways offered by our school."
            items={programs.map((item) => ({
              title: item.name,
              description: item.description,
              imageUrl: item.imageUrl,
            }))}
          />
        ) : null}
        {homepage.facilities.enabled && facilities.length ? (
          <PublicCollection
            title="Facilities"
            intro="Spaces designed for learning, discovery and growth."
            items={facilities.map((item) => ({
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
            }))}
          />
        ) : null}
        {homepage.faculty.enabled && faculty.length ? (
          <section id="faculty" className="website-faculty-section">
            <header>
              <h2>Meet our faculty</h2>
              <p>The educators who guide our students every day.</p>
            </header>
            <div>
              {faculty.map((person) => (
                <article key={`${person.sourceTeacherId ?? person.name}-${person.sortOrder}`}>
                  {person.imageUrl ? (
                    <img src={person.imageUrl} alt={person.name} />
                  ) : (
                    <span aria-hidden="true">{person.name.charAt(0)}</span>
                  )}
                  <h3>{person.name}</h3>
                  <strong>{person.designation}</strong>
                  {person.qualification ? <p>{person.qualification}</p> : null}
                  {person.subjects.length ? <small>{person.subjects.join(' · ')}</small> : null}
                  {person.bio ? <p>{person.bio}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      {homepage.contact.enabled ? (
        <div id="contact">
          <PublicFooter settings={settings} />
        </div>
      ) : (
        <footer className="website-public-footer">
          <strong>{settings.schoolName}</strong>
          <Link href="/login" className="website-portal-link">
            Staff Portal
          </Link>
        </footer>
      )}
    </div>
  );
}

function PublicCollection({
  id,
  title,
  intro,
  items,
}: {
  id?: string;
  title: string;
  intro: string;
  items: Array<{ title: string; description?: string; imageUrl?: string }>;
}) {
  return (
    <section id={id} className="website-collection-section">
      <header>
        <h2>{title}</h2>
        <p>{intro}</p>
      </header>
      <div>
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" />
            ) : (
              <span className="website-collection-mark" aria-hidden="true" />
            )}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
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
