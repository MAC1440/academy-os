'use client';

import Link from 'next/link';
import {
  useGetPublicGalleryAlbumQuery,
  useGetPublicNewsArticleQuery,
  useGetPublicWebsiteContentQuery,
  useGetPublicWebsiteQuery,
} from './website.api';
import { websiteTheme } from './website-theme';

function Shell({ children }: { children: React.ReactNode }) {
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
function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="website-index-heading">
      <span>{eyebrow}</span>
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
          eyebrow="School journal"
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
              eyebrow="Achievement"
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
          eyebrow="School calendar"
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
          eyebrow="Life at school"
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
              eyebrow="Photo album"
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
