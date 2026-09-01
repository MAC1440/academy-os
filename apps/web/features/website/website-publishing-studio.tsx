'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays, ImagePlus, Megaphone, Newspaper, Plus, Trophy } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useSaveCalendarDayMutation } from '@web/features/calendar/calendar.api';
import {
  useDeleteWebsiteContentMutation,
  useDeleteWebsiteMediaMutation,
  useAddWebsiteAlbumImageMutation,
  useGetWebsiteContentQuery,
  useSaveWebsiteContentMutation,
  useRemoveWebsiteAlbumImageMutation,
  useUploadWebsiteMediaMutation,
  type WebsiteAnnouncement,
  type WebsiteNews,
  type WebsiteResult,
} from './website.api';

type Tab = 'announcements' | 'news' | 'results' | 'events' | 'gallery' | 'media';
const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
  { id: 'news', label: 'News', icon: <Newspaper size={16} /> },
  { id: 'results', label: 'Results', icon: <Trophy size={16} /> },
  { id: 'events', label: 'Events', icon: <CalendarDays size={16} /> },
  { id: 'gallery', label: 'Gallery', icon: <ImagePlus size={16} /> },
  { id: 'media', label: 'Media', icon: <ImagePlus size={16} /> },
];
const dateValue = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : '';

export function WebsitePublishingStudio() {
  const toast = useToast();
  const content = useGetWebsiteContentQuery();
  const [tab, setTab] = useState<Tab>('announcements');
  const [save] = useSaveWebsiteContentMutation();
  const [remove] = useDeleteWebsiteContentMutation();
  const [saveDay] = useSaveCalendarDayMutation();
  const [upload, uploadState] = useUploadWebsiteMediaMutation();
  const [deleteMedia] = useDeleteWebsiteMediaMutation();
  const [addAlbumImage] = useAddWebsiteAlbumImageMutation();
  const [removeAlbumImage] = useRemoveWebsiteAlbumImageMutation();

  async function saveItem(
    kind: 'announcements' | 'news' | 'results' | 'albums',
    id: string | undefined,
    body: unknown,
  ) {
    try {
      await save({ kind, id, body }).unwrap();
      toast.success(id ? 'Changes saved.' : 'Content created.');
    } catch {
      toast.error('This item could not be saved. Check required fields and URL slugs.');
    }
  }
  async function deleteItem(kind: 'announcements' | 'news' | 'results' | 'albums', id: string) {
    try {
      await remove({ kind, id }).unwrap();
      toast.success('Item removed.');
    } catch {
      toast.error('This item could not be removed.');
    }
  }
  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file') as File;
    if (
      !file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      return toast.error('Choose a JPEG, PNG, or WebP image up to 5 MB.');
    try {
      await upload(form).unwrap();
      event.currentTarget.reset();
      toast.success('Image added to the media library.');
    } catch {
      toast.error('Upload failed. Confirm the ImageKit server key is configured.');
    }
  }
  if (content.isLoading)
    return <p className="text-sm text-muted-foreground">Loading publishing tools…</p>;
  if (!content.data)
    return <p className="text-sm text-destructive">Publishing tools could not be loaded.</p>;

  return (
    <section className="website-publishing-studio">
      <header>
        <div>
          <h2>Keep the public website current</h2>
          <p>
            Schedule updates, share calendar moments, and organize approved imagery in one place.
          </p>
        </div>
      </header>
      <nav className="website-studio-tabs" aria-label="Website publishing sections">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'announcements' && (
        <StudioCollection
          title="Announcement"
          intro="Short, time-sensitive notices. Expired items disappear automatically."
          onNew={(body) => saveItem('announcements', undefined, body)}
          fields="announcement"
        >
          {content.data.announcements.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              save={(body) => saveItem('announcements', item.id, body)}
              remove={() => deleteItem('announcements', item.id)}
            />
          ))}
        </StudioCollection>
      )}
      {tab === 'news' && (
        <StudioCollection
          title="News article"
          intro="Longer stories with a shareable URL and search preview."
          onNew={(body) => saveItem('news', undefined, body)}
          fields="news"
        >
          {content.data.news.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              save={(body) => saveItem('news', item.id, body)}
              remove={() => deleteItem('news', item.id)}
            />
          ))}
        </StudioCollection>
      )}
      {tab === 'results' && (
        <StudioCollection
          title="Result highlight"
          intro="Publish approved, school-level achievements only—never individual marks."
          onNew={(body) => saveItem('results', undefined, body)}
          fields="results"
        >
          {content.data.results.map((item) => (
            <ResultCard
              key={item.id}
              item={item}
              save={(body) => saveItem('results', item.id, body)}
              remove={() => deleteItem('results', item.id)}
            />
          ))}
        </StudioCollection>
      )}
      {tab === 'events' && (
        <div className="website-studio-grid">
          <div className="website-studio-empty">
            <CalendarDays />
            <h3>Academic calendar events</h3>
            <p>
              Calendar entries with a label can be made public here. They remain managed by the
              existing academic calendar.
            </p>
          </div>
          {content.data.events.map((event) => (
            <article className="website-content-card" key={event.id}>
              <div>
                <span>
                  {new Date(event.calendarDate).toLocaleDateString('en-PK', {
                    dateStyle: 'medium',
                  })}
                </span>
                <h3>{event.label}</h3>
                <p>{event.description || 'No public description yet.'}</p>
              </div>
              <button
                type="button"
                className={event.visibility === 'PUBLIC' ? 'button-secondary' : 'button-primary'}
                onClick={async () => {
                  await saveDay({
                    date: event.calendarDate.slice(0, 10),
                    dayType: event.dayType,
                    label: event.label,
                    description: event.description,
                    visibility: event.visibility === 'PUBLIC' ? 'INTERNAL' : 'PUBLIC',
                  }).unwrap();
                  toast.success(
                    event.visibility === 'PUBLIC'
                      ? 'Event is now internal.'
                      : 'Event is now public.',
                  );
                }}
              >
                {event.visibility === 'PUBLIC' ? 'Make internal' : 'Show publicly'}
              </button>
            </article>
          ))}
        </div>
      )}
      {tab === 'gallery' && (
        <StudioCollection
          title="Gallery album"
          intro="Create curated albums, then add approved images from the media library."
          onNew={(body) => saveItem('albums', undefined, body)}
          fields="albums"
        >
          {content.data.albums.map((album) => (
            <article key={album.id} className="website-content-card website-album-manager-card">
              <div>
                <span>
                  {album.published ? 'Published' : 'Draft'} · {album.images.length} images
                </span>
                <h3>{album.title}</h3>
                <p>{album.description || `/${album.slug}`}</p>
                {album.images.length ? (
                  <div className="website-album-thumbs">
                    {album.images.map((image) => (
                      <button
                        title="Remove image"
                        type="button"
                        key={image.id}
                        onClick={() =>
                          removeAlbumImage({ albumId: album.id, mediaId: image.mediaId })
                        }
                      >
                        <img src={image.media.url} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="website-album-actions">
                <select
                  className="field"
                  defaultValue=""
                  aria-label={`Add image to ${album.title}`}
                  onChange={async (event) => {
                    if (!event.target.value) return;
                    await addAlbumImage({
                      albumId: album.id,
                      mediaId: event.target.value,
                      sortOrder: album.images.length,
                    }).unwrap();
                    event.target.value = '';
                    toast.success('Image added to album.');
                  }}
                >
                  <option value="">Add image…</option>
                  {content
                    .data!.media.filter(
                      (media) => !album.images.some((image) => image.mediaId === media.id),
                    )
                    .map((media) => (
                      <option value={media.id} key={media.id}>
                        {media.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    saveItem('albums', album.id, {
                      title: album.title,
                      slug: album.slug,
                      description: album.description,
                      coverImageUrl: album.coverImageUrl,
                      academicCalendarDayId: album.academicCalendarDayId,
                      published: !album.published,
                      sortOrder: album.sortOrder,
                    })
                  }
                >
                  {album.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="website-text-danger"
                  onClick={() => deleteItem('albums', album.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </StudioCollection>
      )}
      {tab === 'media' && (
        <div className="website-media-library">
          <form onSubmit={uploadImage} className="website-upload-panel">
            <ImagePlus size={26} />
            <div>
              <h3>Upload an approved image</h3>
              <p>JPEG, PNG, or WebP · maximum 5 MB</p>
            </div>
            <select name="category" className="field" defaultValue="GALLERY">
              <option>GALLERY</option>
              <option>NEWS</option>
              <option>RESULTS</option>
              <option>HERO</option>
              <option>FACULTY</option>
              <option>FACILITIES</option>
              <option>BRANDING</option>
            </select>
            <input
              className="field"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
            <button className="button-primary" disabled={uploadState.isLoading}>
              {uploadState.isLoading ? 'Uploading…' : 'Upload image'}
            </button>
          </form>
          <div className="website-media-grid">
            {content.data.media.map((media) => (
              <figure key={media.id}>
                <img src={media.url} alt="" />
                <figcaption>
                  <strong>{media.name}</strong>
                  <span>
                    {media.category} · {(media.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Remove ${media.name} from ImageKit and this library?`))
                        return;
                      try {
                        await deleteMedia(media.id).unwrap();
                        toast.success('Image removed.');
                      } catch {
                        toast.error('Remove this image from any gallery albums first.');
                      }
                    }}
                  >
                    Remove
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StudioCollection({
  title,
  intro,
  onNew,
  fields,
  children,
}: {
  title: string;
  intro: string;
  onNew: (body: unknown) => void;
  fields: 'announcement' | 'news' | 'results' | 'albums';
  children: React.ReactNode;
}) {
  return (
    <div className="website-studio-grid">
      <form
        className="website-content-create"
        onSubmit={(event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget));
          const common = { title: data.title, published: data.published === 'on' };
          let body: unknown = common;
          if (fields === 'announcement')
            body = {
              ...common,
              description: data.description,
              pinned: data.pinned === 'on',
              publishAt: data.publishAt || undefined,
              expireAt: data.expireAt || undefined,
            };
          if (fields === 'news')
            body = {
              ...common,
              slug: data.slug,
              excerpt: data.description,
              body: data.body,
              publishAt: data.publishAt || undefined,
            };
          if (fields === 'results')
            body = {
              ...common,
              description: data.description,
              academicYear: data.academicYear,
              highlights: String(data.highlights)
                .split('\n')
                .map((v) => v.trim())
                .filter(Boolean),
              publishAt: data.publishAt || undefined,
            };
          if (fields === 'albums')
            body = {
              ...common,
              slug: data.slug,
              description: data.description || undefined,
              sortOrder: 0,
            };
          onNew(body);
          event.currentTarget.reset();
        }}
      >
        <h3>New {title.toLowerCase()}</h3>
        <p>{intro}</p>
        <input className="field" name="title" placeholder="Title" required />
        {fields !== 'albums' && (
          <textarea
            className="field"
            name="description"
            placeholder={fields === 'news' ? 'Short excerpt' : 'Description'}
            required
          />
        )}
        {(fields === 'news' || fields === 'albums') && (
          <input className="field" name="slug" placeholder="url-slug" required />
        )}
        {fields === 'news' && <RichTextField />}
        {fields === 'results' && (
          <>
            <input
              className="field"
              name="academicYear"
              placeholder="Academic year, e.g. 2025–26"
              required
            />
            <textarea
              className="field"
              name="highlights"
              placeholder={'One public highlight per line'}
              required
            />
          </>
        )}
        {fields !== 'albums' && <input className="field" name="publishAt" type="datetime-local" />}
        <div className="website-inline-checks">
          <label>
            <input type="checkbox" name="published" /> Publish
          </label>
          {fields === 'announcement' && (
            <label>
              <input type="checkbox" name="pinned" /> Pin
            </label>
          )}
        </div>
        {fields === 'announcement' && (
          <input className="field" name="expireAt" type="datetime-local" aria-label="Expiry date" />
        )}
        <button className="button-primary">
          <Plus size={16} /> Add {title.toLowerCase()}
        </button>
      </form>
      <div className="website-content-list">{children}</div>
    </div>
  );
}
function RichTextField() {
  const [value, setValue] = useState('');
  const insert = (token: string) => setValue((v) => `${v}${v ? '\n' : ''}${token}`);
  return (
    <div className="website-rich-field">
      <div>
        <button type="button" onClick={() => insert('## Heading')}>
          Heading
        </button>
        <button type="button" onClick={() => insert('**bold**')}>
          Bold
        </button>
        <button type="button" onClick={() => insert('*italic*')}>
          Italic
        </button>
        <button type="button" onClick={() => insert('- List item')}>
          List
        </button>
        <button type="button" onClick={() => insert('[link text](https://)')}>
          Link
        </button>
      </div>
      <textarea
        className="field"
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write the article…"
        required
      />
    </div>
  );
}
function AnnouncementCard({
  item,
  save,
  remove,
}: {
  item: WebsiteAnnouncement;
  save: (b: unknown) => void;
  remove: () => void;
}) {
  return (
    <ContentCard
      item={item}
      meta={`${item.pinned ? 'Pinned · ' : ''}${item.published ? 'Published' : 'Draft'}`}
      save={() =>
        save({
          ...item,
          published: !item.published,
          publishAt: item.publishAt || undefined,
          expireAt: item.expireAt || undefined,
        })
      }
      remove={remove}
    />
  );
}
function NewsCard({
  item,
  save,
  remove,
}: {
  item: WebsiteNews;
  save: (b: unknown) => void;
  remove: () => void;
}) {
  return (
    <ContentCard
      item={item}
      meta={`${item.published ? 'Published' : 'Draft'} · /news/${item.slug}`}
      save={() =>
        save({ ...item, published: !item.published, publishAt: item.publishAt || undefined })
      }
      remove={remove}
    />
  );
}
function ResultCard({
  item,
  save,
  remove,
}: {
  item: WebsiteResult;
  save: (b: unknown) => void;
  remove: () => void;
}) {
  return (
    <ContentCard
      item={item}
      meta={`${item.academicYear} · ${item.published ? 'Published' : 'Draft'}`}
      save={() =>
        save({ ...item, published: !item.published, publishAt: item.publishAt || undefined })
      }
      remove={remove}
    />
  );
}
function ContentCard({
  item,
  meta,
  save,
  remove,
}: {
  item: {
    title: string;
    description?: string;
    excerpt?: string;
    published: boolean;
    publishAt?: string | null;
  };
  meta: string;
  save: () => void;
  remove: () => void;
}) {
  return (
    <article className="website-content-card">
      <div>
        <span>
          {meta}
          {item.publishAt ? ` · ${dateValue(item.publishAt).replace('T', ' ')}` : ''}
        </span>
        <h3>{item.title}</h3>
        <p>{item.description || item.excerpt}</p>
      </div>
      <div>
        <button type="button" className="button-secondary" onClick={save}>
          {item.published ? 'Unpublish' : 'Publish'}
        </button>
        <button type="button" className="website-text-danger" onClick={remove}>
          Delete
        </button>
      </div>
    </article>
  );
}
