'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  type WebsiteSettings,
  useGetWebsiteFacultyImportsQuery,
  useGetWebsiteProgramImportsQuery,
} from './website.api';

type Props = { settings: WebsiteSettings; onChange: (settings: WebsiteSettings) => void };
const text = (value: string | undefined) => value ?? '';

export function WebsiteContentManager({ settings, onChange }: Props) {
  const programImports = useGetWebsiteProgramImportsQuery();
  const facultyImports = useGetWebsiteFacultyImportsQuery();
  const setHomepage = (key: keyof WebsiteSettings['homepage'], value: object) =>
    onChange({ ...settings, homepage: { ...settings.homepage, [key]: value } });
  const warnings = [
    settings.homepage.hero.enabled && !settings.homepage.hero.title.trim()
      ? 'Hero is enabled but its headline is missing.'
      : null,
    settings.homepage.introduction.enabled &&
    (!settings.homepage.introduction.heading.trim() ||
      !settings.homepage.introduction.content.trim())
      ? 'School introduction needs both a heading and content.'
      : null,
    settings.homepage.principalMessage.enabled &&
    (!settings.homepage.principalMessage.name?.trim() ||
      !settings.homepage.principalMessage.message?.trim())
      ? 'Principal message needs a name and message.'
      : null,
    settings.homepage.programs.enabled &&
    !settings.programs.some((item) => item.visible && item.name.trim())
      ? 'Programs is enabled but has no public entries.'
      : null,
    settings.homepage.facilities.enabled &&
    !settings.facilities.some((item) => item.visible && item.title.trim())
      ? 'Facilities is enabled but has no public entries.'
      : null,
    settings.homepage.faculty.enabled &&
    !settings.faculty.some((item) => item.visible && item.name.trim() && item.designation.trim())
      ? 'Faculty is enabled but has no complete public profiles.'
      : null,
    settings.homepage.contact.enabled &&
    !settings.contactEmail &&
    !settings.phone &&
    !settings.address
      ? 'Contact is enabled but no contact details are configured.'
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="website-content-manager">
      <header>
        <h2>Homepage content</h2>
        <p>Enabled sections publish only when their required content is complete.</p>
      </header>
      {warnings.length ? (
        <aside className="website-content-warnings">
          <strong>
            {warnings.length} section {warnings.length === 1 ? 'warning' : 'warnings'}
          </strong>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning} The public section stays hidden.</li>
            ))}
          </ul>
        </aside>
      ) : null}

      <ContentBlock
        title="Hero"
        enabled={settings.homepage.hero.enabled}
        onToggle={(enabled) => setHomepage('hero', { ...settings.homepage.hero, enabled })}
      >
        <Field
          label="Headline"
          value={settings.homepage.hero.title}
          onChange={(title) => setHomepage('hero', { ...settings.homepage.hero, title })}
        />
        <Field
          label="Supporting text"
          value={text(settings.homepage.hero.subtitle)}
          onChange={(subtitle) => setHomepage('hero', { ...settings.homepage.hero, subtitle })}
        />
        <Field
          label="Image URL"
          type="url"
          value={text(settings.homepage.hero.imageUrl)}
          onChange={(imageUrl) =>
            setHomepage('hero', { ...settings.homepage.hero, imageUrl: imageUrl || undefined })
          }
        />
        <Field
          label="Button label"
          value={text(settings.homepage.hero.ctaText)}
          onChange={(ctaText) => setHomepage('hero', { ...settings.homepage.hero, ctaText })}
        />
        <Field
          label="Button link"
          value={text(settings.homepage.hero.ctaLink)}
          onChange={(ctaLink) => setHomepage('hero', { ...settings.homepage.hero, ctaLink })}
        />
      </ContentBlock>

      <ContentBlock
        title="School introduction"
        enabled={settings.homepage.introduction.enabled}
        onToggle={(enabled) =>
          setHomepage('introduction', { ...settings.homepage.introduction, enabled })
        }
      >
        <Field
          label="Heading"
          value={settings.homepage.introduction.heading}
          onChange={(heading) =>
            setHomepage('introduction', { ...settings.homepage.introduction, heading })
          }
        />
        <Field
          label="Introduction"
          multiline
          value={settings.homepage.introduction.content}
          onChange={(content) =>
            setHomepage('introduction', { ...settings.homepage.introduction, content })
          }
        />
        <Field
          label="Image URL"
          type="url"
          value={text(settings.homepage.introduction.imageUrl)}
          onChange={(imageUrl) =>
            setHomepage('introduction', {
              ...settings.homepage.introduction,
              imageUrl: imageUrl || undefined,
            })
          }
        />
      </ContentBlock>

      <ContentBlock
        title="Principal or director message"
        enabled={settings.homepage.principalMessage.enabled}
        onToggle={(enabled) =>
          setHomepage('principalMessage', { ...settings.homepage.principalMessage, enabled })
        }
      >
        <Field
          label="Name"
          value={text(settings.homepage.principalMessage.name)}
          onChange={(name) =>
            setHomepage('principalMessage', { ...settings.homepage.principalMessage, name })
          }
        />
        <Field
          label="Designation"
          value={text(settings.homepage.principalMessage.designation)}
          onChange={(designation) =>
            setHomepage('principalMessage', { ...settings.homepage.principalMessage, designation })
          }
        />
        <Field
          label="Message"
          multiline
          value={text(settings.homepage.principalMessage.message)}
          onChange={(message) =>
            setHomepage('principalMessage', { ...settings.homepage.principalMessage, message })
          }
        />
        <Field
          label="Photo URL"
          type="url"
          value={text(settings.homepage.principalMessage.imageUrl)}
          onChange={(imageUrl) =>
            setHomepage('principalMessage', {
              ...settings.homepage.principalMessage,
              imageUrl: imageUrl || undefined,
            })
          }
        />
      </ContentBlock>

      <CollectionBlock
        title="Programs"
        enabled={settings.homepage.programs.enabled}
        onToggle={(enabled) => setHomepage('programs', { enabled })}
        onAdd={() =>
          onChange({
            ...settings,
            programs: [
              ...settings.programs,
              { name: 'New program', visible: true, sortOrder: settings.programs.length },
            ],
          })
        }
      >
        {programImports.data?.length ? (
          <ImportStrip
            label="Import from Academics"
            items={programImports.data
              .filter(
                (source) => !settings.programs.some((item) => item.sourceId === source.sourceId),
              )
              .map((source) => ({
                id: source.sourceId,
                label: source.name,
                add: () =>
                  onChange({
                    ...settings,
                    programs: [
                      ...settings.programs,
                      {
                        sourceId: source.sourceId,
                        name: source.name,
                        description: source.description,
                        visible: true,
                        sortOrder: settings.programs.length,
                      },
                    ],
                  }),
              }))}
          />
        ) : null}
        {settings.programs.map((item, index) => (
          <EditorRow
            key={`${item.sourceId ?? 'manual'}-${index}`}
            title={item.name}
            visible={item.visible}
            onVisible={(visible) =>
              replace(settings.programs, index, { ...item, visible }, (programs) =>
                onChange({ ...settings, programs }),
              )
            }
            onRemove={() =>
              remove(settings.programs, index, (programs) => onChange({ ...settings, programs }))
            }
          >
            <Field
              label="Public name"
              value={item.name}
              onChange={(name) =>
                replace(settings.programs, index, { ...item, name }, (programs) =>
                  onChange({ ...settings, programs }),
                )
              }
            />
            <Field
              label="Description"
              multiline
              value={text(item.description)}
              onChange={(description) =>
                replace(settings.programs, index, { ...item, description }, (programs) =>
                  onChange({ ...settings, programs }),
                )
              }
            />
            <Field
              label="Image URL"
              type="url"
              value={text(item.imageUrl)}
              onChange={(imageUrl) =>
                replace(
                  settings.programs,
                  index,
                  { ...item, imageUrl: imageUrl || undefined },
                  (programs) => onChange({ ...settings, programs }),
                )
              }
            />
          </EditorRow>
        ))}
      </CollectionBlock>

      <CollectionBlock
        title="Facilities"
        enabled={settings.homepage.facilities.enabled}
        onToggle={(enabled) => setHomepage('facilities', { enabled })}
        onAdd={() =>
          onChange({
            ...settings,
            facilities: [
              ...settings.facilities,
              { title: 'New facility', visible: true, sortOrder: settings.facilities.length },
            ],
          })
        }
      >
        {settings.facilities.map((item, index) => (
          <EditorRow
            key={`facility-${index}`}
            title={item.title}
            visible={item.visible}
            onVisible={(visible) =>
              replace(settings.facilities, index, { ...item, visible }, (facilities) =>
                onChange({ ...settings, facilities }),
              )
            }
            onRemove={() =>
              remove(settings.facilities, index, (facilities) =>
                onChange({ ...settings, facilities }),
              )
            }
          >
            <Field
              label="Title"
              value={item.title}
              onChange={(title) =>
                replace(settings.facilities, index, { ...item, title }, (facilities) =>
                  onChange({ ...settings, facilities }),
                )
              }
            />
            <Field
              label="Description"
              multiline
              value={text(item.description)}
              onChange={(description) =>
                replace(settings.facilities, index, { ...item, description }, (facilities) =>
                  onChange({ ...settings, facilities }),
                )
              }
            />
            <Field
              label="Image URL"
              type="url"
              value={text(item.imageUrl)}
              onChange={(imageUrl) =>
                replace(
                  settings.facilities,
                  index,
                  { ...item, imageUrl: imageUrl || undefined },
                  (facilities) => onChange({ ...settings, facilities }),
                )
              }
            />
          </EditorRow>
        ))}
      </CollectionBlock>

      <CollectionBlock
        title="Faculty"
        enabled={settings.homepage.faculty.enabled}
        onToggle={(enabled) => setHomepage('faculty', { enabled })}
        onAdd={() =>
          onChange({
            ...settings,
            faculty: [
              ...settings.faculty,
              {
                name: 'New faculty member',
                designation: 'Teacher',
                subjects: [],
                visible: true,
                sortOrder: settings.faculty.length,
              },
            ],
          })
        }
      >
        {facultyImports.data?.length ? (
          <ImportStrip
            label="Import from Staff"
            items={facultyImports.data
              .filter(
                (source) =>
                  !settings.faculty.some((item) => item.sourceTeacherId === source.sourceTeacherId),
              )
              .map((source) => ({
                id: source.sourceTeacherId,
                label: source.name,
                add: () =>
                  onChange({
                    ...settings,
                    faculty: [
                      ...settings.faculty,
                      { ...source, visible: true, sortOrder: settings.faculty.length },
                    ],
                  }),
              }))}
          />
        ) : null}
        {settings.faculty.map((item, index) => (
          <EditorRow
            key={`${item.sourceTeacherId ?? 'manual'}-${index}`}
            title={item.name}
            visible={item.visible}
            onVisible={(visible) =>
              replace(settings.faculty, index, { ...item, visible }, (faculty) =>
                onChange({ ...settings, faculty }),
              )
            }
            onRemove={() =>
              remove(settings.faculty, index, (faculty) => onChange({ ...settings, faculty }))
            }
          >
            <Field
              label="Public name"
              value={item.name}
              onChange={(name) =>
                replace(settings.faculty, index, { ...item, name }, (faculty) =>
                  onChange({ ...settings, faculty }),
                )
              }
            />
            <Field
              label="Designation"
              value={item.designation}
              onChange={(designation) =>
                replace(settings.faculty, index, { ...item, designation }, (faculty) =>
                  onChange({ ...settings, faculty }),
                )
              }
            />
            <Field
              label="Qualification"
              value={text(item.qualification)}
              onChange={(qualification) =>
                replace(settings.faculty, index, { ...item, qualification }, (faculty) =>
                  onChange({ ...settings, faculty }),
                )
              }
            />
            <Field
              label="Subjects (comma separated)"
              value={item.subjects.join(', ')}
              onChange={(value) =>
                replace(
                  settings.faculty,
                  index,
                  {
                    ...item,
                    subjects: value
                      .split(',')
                      .map((part) => part.trim())
                      .filter(Boolean),
                  },
                  (faculty) => onChange({ ...settings, faculty }),
                )
              }
            />
            <Field
              label="Short bio"
              multiline
              value={text(item.bio)}
              onChange={(bio) =>
                replace(settings.faculty, index, { ...item, bio }, (faculty) =>
                  onChange({ ...settings, faculty }),
                )
              }
            />
            <Field
              label="Photo URL"
              type="url"
              value={text(item.imageUrl)}
              onChange={(imageUrl) =>
                replace(
                  settings.faculty,
                  index,
                  { ...item, imageUrl: imageUrl || undefined },
                  (faculty) => onChange({ ...settings, faculty }),
                )
              }
            />
          </EditorRow>
        ))}
      </CollectionBlock>

      <label className="website-content-contact">
        <input
          type="checkbox"
          checked={settings.homepage.contact.enabled}
          onChange={(event) => setHomepage('contact', { enabled: event.target.checked })}
        />
        <span>
          <strong>Show contact section</strong>
          <small>Uses the contact details configured above.</small>
        </span>
      </label>
    </div>
  );
}

function ContentBlock({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="website-content-block">
      <div className="website-content-block-heading">
        <h3>{title}</h3>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
          />{' '}
          Enabled
        </label>
      </div>
      <div className="website-content-fields">{children}</div>
    </section>
  );
}
function CollectionBlock({
  title,
  enabled,
  onToggle,
  onAdd,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="website-content-block">
      <div className="website-content-block-heading">
        <div>
          <h3>{title}</h3>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => onToggle(event.target.checked)}
            />{' '}
            Enabled
          </label>
        </div>
        <button
          type="button"
          className="button-secondary inline-flex items-center gap-2"
          onClick={onAdd}
        >
          <Plus size={15} /> Add manually
        </button>
      </div>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  multiline,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {multiline ? (
        <textarea
          className="field min-h-24 resize-y"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="field"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
function EditorRow({
  title,
  visible,
  onVisible,
  onRemove,
  children,
}: {
  title: string;
  visible: boolean;
  onVisible: (visible: boolean) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="website-content-row">
      <div className="website-content-row-heading">
        <strong>{title}</strong>
        <div>
          <label>
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => onVisible(event.target.checked)}
            />{' '}
            Public
          </label>
          <button type="button" aria-label={`Remove ${title}`} onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="website-content-fields">{children}</div>
    </div>
  );
}
function ImportStrip({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; label: string; add: () => void }>;
}) {
  if (!items.length) return null;
  return (
    <div className="website-import-strip">
      <strong>{label}</strong>
      <div>
        {items.map((item) => (
          <button type="button" key={item.id} onClick={item.add}>
            <Plus size={13} /> {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
function replace<T>(items: T[], index: number, item: T, done: (items: T[]) => void) {
  done(items.map((current, currentIndex) => (currentIndex === index ? item : current)));
}
function remove<T>(items: T[], index: number, done: (items: T[]) => void) {
  done(items.filter((_, currentIndex) => currentIndex !== index));
}
