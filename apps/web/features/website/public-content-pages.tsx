'use client';

import Link from 'next/link';
import {
  useGetPublicGalleryAlbumQuery,
  useGetPublicNewsArticleQuery,
  useGetPublicWebsiteContentQuery,
  useGetPublicWebsiteQuery,
} from './website.api';
import { FormEvent, useEffect, useState } from 'react';
import {
  useGetPublicAdmissionOptionsQuery,
  useSubmitWebsiteAdmissionMutation,
} from '@web/features/admissions/admissions.api';
import { websiteTheme } from './website-theme';

export function Shell({ children }: { children: React.ReactNode }) {
  const website = useGetPublicWebsiteQuery();
  if (website.isLoading) return <main className="website-public-state">Loading website…</main>;
  const settings = website.data?.data;
  if (!settings)
    return <main className="website-public-state">This website is not published yet.</main>;
  return (
    <div
      className={`website-public website-template-${settings.template.toLowerCase()}`}
      style={websiteTheme(settings)}
    >
      <WebsiteMeta
        title={settings.seo?.defaultTitle || settings.schoolName}
        description={settings.seo?.defaultDescription || settings.tagline}
        image={settings.seo?.defaultSocialImage}
      />
      <header className="website-public-header">
        <Link className="website-wordmark" href="/">
          <span className="website-lettermark">{settings.schoolName.charAt(0)}</span>
          <span>{settings.schoolName}</span>
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/news">News</Link>
          <Link href="/events">Events</Link>
          <Link href="/gallery">Gallery</Link>
          {settings.admissions?.enabled ? <Link href="/apply">Apply</Link> : null}
        </nav>
      </header>
      {children}
      <footer className="website-public-footer">
        <strong>{settings.schoolName}</strong>
        <Link href="/login" className="website-portal-link">
          Staff Portal
        </Link>
      </footer>
    </div>
  );
}

function WebsiteMeta({
  title,
  description,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
}) {
  useEffect(() => {
    document.title = title;
    const set = (selector: string, attribute: 'name' | 'property', key: string, value?: string) => {
      if (!value) return;
      let node = document.querySelector<HTMLMetaElement>(selector);
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attribute, key);
        document.head.appendChild(node);
      }
      node.content = value;
    };
    set('meta[name="description"]', 'name', 'description', description);
    set('meta[property="og:title"]', 'property', 'og:title', title);
    set('meta[property="og:description"]', 'property', 'og:description', description);
    set('meta[property="og:image"]', 'property', 'og:image', image);
  }, [title, description, image]);
  return null;
}

export function PublicAdmissionsPage() {
  const options = useGetPublicAdmissionOptionsQuery();
  const [submit, submitState] = useSubmitWebsiteAdmissionMutation();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const optional = (key: string) => String(values[key] || '').trim() || undefined;
    try {
      const result = await submit({
        academicOfferingId: String(values.academicOfferingId),
        studentFullName: String(values.studentFullName),
        studentCnic: String(values.studentCnic).replace(/\D/g, ''),
        dateOfBirth: String(values.dateOfBirth),
        gender: values.gender as 'MALE' | 'FEMALE' | 'OTHER',
        guardianFullName: String(values.guardianFullName),
        relationship: String(values.relationship),
        guardianPhone: String(values.guardianPhone),
        alternatePhone: optional('alternatePhone'),
        email: optional('email'),
        previousSchool: optional('previousSchool'),
        previousClass: optional('previousClass'),
        address: String(values.address),
        notes: optional('notes'),
        website: optional('website'),
      }).unwrap();
      setConfirmation(result.message);
      event.currentTarget.reset();
    } catch (failure) {
      const response = failure as { data?: { message?: string } };
      setError(
        response.data?.message ||
          'Your application could not be submitted. Check the form and try again.',
      );
    }
  }
  return (
    <Shell>
      <main className="website-admission-page">
        <header>
          <h1>{options.data?.heading || 'Admissions'}</h1>
          <p>
            {options.data?.description || 'Submit an application for an eligible class or course.'}
          </p>
        </header>
        {options.isLoading ? (
          <p>Loading admissions…</p>
        ) : !options.data?.enabled || !options.data.isOpen ? (
          <section className="website-admission-closed">
            <h2>Online applications are currently closed</h2>
            <p>Please check back later or contact the school for admission information.</p>
          </section>
        ) : confirmation ? (
          <section className="website-admission-success" role="status">
            <h2>Application received</h2>
            <p>{confirmation}</p>
            <button className="website-public-action" onClick={() => setConfirmation('')}>
              Submit another application
            </button>
          </section>
        ) : (
          <form className="website-admission-form" onSubmit={send}>
            <input
              className="website-honeypot"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <fieldset>
              <legend>Student details</legend>
              <div>
                <label>
                  Student name
                  <input name="studentFullName" required maxLength={160} />
                </label>
                <label>
                  B-Form number
                  <input
                    name="studentCnic"
                    inputMode="numeric"
                    pattern="[0-9]{13}"
                    maxLength={13}
                    required
                  />
                </label>
                <label>
                  Date of birth
                  <input name="dateOfBirth" type="date" required />
                </label>
                <label>
                  Gender
                  <select name="gender" required defaultValue="">
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="wide">
                  Applying for
                  <select name="academicOfferingId" required defaultValue="">
                    <option value="" disabled>
                      Select a class or course
                    </option>
                    {options.data.offerings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.sectionName ? ` · ${item.sectionName}` : ''} — {item.branchName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Parent or guardian</legend>
              <div>
                <label>
                  Guardian name
                  <input name="guardianFullName" required maxLength={160} />
                </label>
                <label>
                  Relationship
                  <input name="relationship" required maxLength={80} />
                </label>
                <label>
                  Mobile number
                  <input
                    name="guardianPhone"
                    type="tel"
                    placeholder="03451234567"
                    pattern="(\+92|0)3[0-9]{9}"
                    required
                  />
                </label>
                <label>
                  Alternate number <small>Optional</small>
                  <input name="alternatePhone" type="tel" pattern="(\+92|0)3[0-9]{9}" />
                </label>
                <label className="wide">
                  Email <small>Optional</small>
                  <input name="email" type="email" maxLength={160} />
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Education and contact</legend>
              <div>
                <label>
                  Previous school <small>Optional</small>
                  <input name="previousSchool" maxLength={300} />
                </label>
                <label>
                  Previous class <small>Optional</small>
                  <input name="previousClass" maxLength={120} />
                </label>
                <label className="wide">
                  Home address
                  <textarea name="address" required maxLength={1000} />
                </label>
                <label className="wide">
                  Additional notes <small>Optional</small>
                  <textarea name="notes" maxLength={2000} />
                </label>
              </div>
            </fieldset>
            {error ? (
              <p className="website-admission-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="website-public-action" disabled={submitState.isLoading}>
              {submitState.isLoading ? 'Submitting…' : 'Submit application'}
            </button>
            <p className="website-form-assurance">
              Your application enters the school’s admissions review. Submission does not guarantee
              admission.
            </p>
          </form>
        )}
      </main>
    </Shell>
  );
}
function Heading({ title, copy }: { title: string; copy: string }) {
  return (
    <header className="website-index-heading">
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

export function NewsIndexPage() {
  const content = useGetPublicWebsiteContentQuery();
  return (
    <Shell>
      <main className="website-index">
        <Heading
          title="News & announcements"
          copy="The latest stories, notices, and achievements from our school community."
        />
        {content.data?.announcements.length ? (
          <section className="website-announcement-strip">
            {content.data.announcements.map((item) => (
              <article key={item.id}>
                <span>{item.pinned ? 'Pinned notice' : 'Announcement'}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </article>
            ))}
          </section>
        ) : null}
        <div className="website-public-card-grid">
          {content.data?.news.map((item) => (
            <Link href={`/news/${item.slug}`} key={item.id} className="website-public-card">
              {item.coverImageUrl ? (
                <img src={item.coverImageUrl} alt="" />
              ) : (
                <span className="website-card-art" />
              )}
              <small>
                {item.publishAt
                  ? new Date(item.publishAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })
                  : 'News'}
              </small>
              <h2>{item.title}</h2>
              <p>{item.excerpt}</p>
              <strong>Read story →</strong>
            </Link>
          ))}
        </div>
        {content.data?.results.length ? (
          <section className="website-results-band">
            <Heading
              title="Recent result highlights"
              copy="Approved, school-level milestones from recent academic years."
            />
            <div>
              {content.data.results.map((item) => (
                <article key={item.id}>
                  <small>{item.academicYear}</small>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <ul>
                    {item.highlights.map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}
export function EventsIndexPage() {
  const content = useGetPublicWebsiteContentQuery();
  return (
    <Shell>
      <main className="website-index">
        <Heading
          title="Upcoming events"
          copy="Public holidays, celebrations, and important dates from the academic calendar."
        />
        <div className="website-event-list">
          {content.data?.events.map((event) => (
            <article key={event.id}>
              <time dateTime={event.calendarDate}>
                <strong>
                  {new Date(event.calendarDate).toLocaleDateString('en-PK', { day: '2-digit' })}
                </strong>
                <span>
                  {new Date(event.calendarDate).toLocaleDateString('en-PK', { month: 'short' })}
                </span>
              </time>
              <div>
                <small>{event.dayType.replace('_', ' ')}</small>
                <h2>{event.label}</h2>
                {event.description ? <p>{event.description}</p> : null}
              </div>
            </article>
          ))}
          {content.data && !content.data.events.length ? (
            <p className="website-empty-copy">There are no public events scheduled yet.</p>
          ) : null}
        </div>
      </main>
    </Shell>
  );
}
export function GalleryIndexPage() {
  const content = useGetPublicWebsiteContentQuery();
  return (
    <Shell>
      <main className="website-index">
        <Heading
          title="Gallery"
          copy="A curated look at learning, celebrations, and community moments."
        />
        <div className="website-public-card-grid">
          {content.data?.albums.map((album) => (
            <Link href={`/gallery/${album.slug}`} key={album.id} className="website-public-card">
              {album.coverImageUrl || album.images[0]?.media.url ? (
                <img src={(album.coverImageUrl || album.images[0]?.media.url)!} alt="" />
              ) : (
                <span className="website-card-art" />
              )}
              <small>{album.images.length} images</small>
              <h2>{album.title}</h2>
              <p>{album.description}</p>
              <strong>View album →</strong>
            </Link>
          ))}
        </div>
      </main>
    </Shell>
  );
}
export function NewsArticlePage({ slug }: { slug: string }) {
  const article = useGetPublicNewsArticleQuery(slug);
  return (
    <Shell>
      <main className="website-article">
        {article.data ? (
          <>
            <WebsiteMeta
              title={article.data.seoTitle || article.data.title}
              description={article.data.seoDescription || article.data.excerpt}
              image={article.data.coverImageUrl}
            />
            <Link href="/news">← All news</Link>
            <header>
              <small>
                {article.data.publishAt
                  ? new Date(article.data.publishAt).toLocaleDateString('en-PK', {
                      dateStyle: 'long',
                    })
                  : 'School news'}
              </small>
              <h1>{article.data.title}</h1>
              <p>{article.data.excerpt}</p>
            </header>
            {article.data.coverImageUrl ? (
              <img className="website-article-cover" src={article.data.coverImageUrl} alt="" />
            ) : null}
            <RichCopy value={article.data.body} />
          </>
        ) : (
          <p>Loading article…</p>
        )}
      </main>
    </Shell>
  );
}
export function GalleryAlbumPage({ slug }: { slug: string }) {
  const album = useGetPublicGalleryAlbumQuery(slug);
  return (
    <Shell>
      <main className="website-index">
        <Link href="/gallery">← All albums</Link>
        {album.data ? (
          <>
            <Heading
              title={album.data.title}
              copy={album.data.description || `${album.data.images.length} approved images`}
            />
            <div className="website-album-grid">
              {album.data.images.map((image) => (
                <figure key={image.id}>
                  <img src={image.media.url} alt={image.caption || ''} />
                  {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </>
        ) : (
          <p>Loading album…</p>
        )}
      </main>
    </Shell>
  );
}
function RichCopy({ value }: { value: string }) {
  return (
    <div className="website-rich-copy">
      {value.split('\n').map((line, index) =>
        line.startsWith('## ') ? (
          <h2 key={index}>{line.slice(3)}</h2>
        ) : line.startsWith('- ') ? (
          <ul key={index}>
            <li>{line.slice(2)}</li>
          </ul>
        ) : line ? (
          <p key={index}>{line.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
        ) : (
          <br key={index} />
        ),
      )}
    </div>
  );
}
