'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';
import type { SyllabusClass, SyllabusGroup } from './syllabus.api';
import { SyllabusContentEditor } from './syllabus-markdown';

export function SyllabusEditor({
  classes,
  onChange,
  classSuggestions,
  subjectSuggestions,
}: {
  classes: SyllabusClass[];
  onChange: (classes: SyllabusClass[]) => void;
  classSuggestions: ApiRecord[];
  subjectSuggestions: ApiRecord[];
}) {
  const toast = useToast();
  const { confirm } = useConfirmation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [classToAdd, setClassToAdd] = useState('');
  useEffect(() => {
    if (selectedIndex >= classes.length) setSelectedIndex(Math.max(0, classes.length - 1));
  }, [classes.length, selectedIndex]);

  function addClass() {
    const name = classToAdd.trim();
    if (!name) return;
    if (classes.some((item) => item.className.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      toast.error(`${name} is already included in this syllabus.`);
      return;
    }
    onChange([...classes, { className: name, groups: [] }]);
    setSelectedIndex(classes.length);
    setClassToAdd('');
  }
  async function removeClass(index: number) {
    const item = classes[index];
    if (!item) return;
    if (
      !(await confirm({
        title: `Remove ${item.className}?`,
        description:
          'Every group, subject, and syllabus entry inside this class will be removed when you save.',
        confirmLabel: 'Remove class',
      }))
    )
      return;
    onChange(classes.filter((_, itemIndex) => itemIndex !== index));
  }
  function updateSelected(next: SyllabusClass) {
    onChange(classes.map((item, index) => (index === selectedIndex ? next : item)));
  }
  const selected = classes[selectedIndex];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1 text-sm font-medium">
          Add a class
          <select
            className="field"
            value={classToAdd}
            onChange={(event) => setClassToAdd(event.target.value)}
          >
            <option value="">Choose from Academics</option>
            {classSuggestions
              .filter(
                (item) =>
                  !classes.some(
                    (syllabusClass) =>
                      syllabusClass.className.toLocaleLowerCase() ===
                      String(item.name).toLocaleLowerCase(),
                  ),
              )
              .map((item) => (
                <option key={item.id} value={String(item.name)}>
                  {String(item.name)}
                </option>
              ))}
          </select>
        </label>
        <button
          type="button"
          className="button-secondary inline-flex items-center justify-center gap-2"
          disabled={!classToAdd}
          onClick={addClass}
        >
          <Plus size={16} /> Add class
        </button>
      </section>

      {classes.length ? (
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {classes.map((item, index) => (
              <button
                key={`${item.className}-${index}`}
                type="button"
                className={index === selectedIndex ? 'button-primary' : 'button-secondary'}
                onClick={() => setSelectedIndex(index)}
              >
                {item.className}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <ClassEditor
          value={selected}
          onChange={updateSelected}
          onRemove={() => removeClass(selectedIndex)}
          subjectSuggestions={subjectSuggestions}
        />
      ) : (
        <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="max-w-md">
            <h2 className="font-display text-2xl">Start with a class</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choose an existing class above. Only its display name is copied into this syllabus.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassEditor({
  value,
  onChange,
  onRemove,
  subjectSuggestions,
}: {
  value: SyllabusClass;
  onChange: (value: SyllabusClass) => void;
  onRemove: () => void;
  subjectSuggestions: ApiRecord[];
}) {
  const [groupName, setGroupName] = useState('');
  function addGroup() {
    const name = groupName.trim();
    if (!name) return;
    onChange({ ...value, groups: [...value.groups, { name, subjects: [] }] });
    setGroupName('');
  }
  function updateGroup(index: number, group: SyllabusGroup) {
    onChange({
      ...value,
      groups: value.groups.map((item, itemIndex) => (itemIndex === index ? group : item)),
    });
  }
  function moveGroup(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.groups.length) return;
    const groups = [...value.groups];
    [groups[index], groups[target]] = [groups[target]!, groups[index]!];
    onChange({ ...value, groups });
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-3xl tracking-[-.03em]">{value.className}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build this class one syllabus group at a time.
          </p>
        </div>
        <button type="button" className="button-destructive" onClick={onRemove}>
          Remove class
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1 text-sm font-medium">
          New group
          <input
            className="field"
            value={groupName}
            maxLength={160}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="e.g. First Term, Revision, Pre-Board"
          />
        </label>
        <button
          type="button"
          className="button-secondary inline-flex items-center justify-center gap-2"
          disabled={!groupName.trim()}
          onClick={addGroup}
        >
          <Plus size={16} /> Add group
        </button>
      </div>
      <div className="space-y-4">
        {value.groups.map((group, index) => (
          <GroupEditor
            key={index}
            group={group}
            index={index}
            total={value.groups.length}
            onChange={(next) => updateGroup(index, next)}
            onRemove={() =>
              onChange({
                ...value,
                groups: value.groups.filter((_, itemIndex) => itemIndex !== index),
              })
            }
            onMove={(direction) => moveGroup(index, direction)}
            subjectSuggestions={subjectSuggestions}
            suggestionListId={`syllabus-subject-suggestions-${index}`}
          />
        ))}
        {!value.groups.length ? (
          <p className="rounded-xl bg-muted/50 p-5 text-sm text-muted-foreground">
            No groups yet. Add a term, semester, assessment, or any structure this class follows.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function GroupEditor({
  group,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  subjectSuggestions,
  suggestionListId,
}: {
  group: SyllabusGroup;
  index: number;
  total: number;
  onChange: (group: SyllabusGroup) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  subjectSuggestions: ApiRecord[];
  suggestionListId: string;
}) {
  const { confirm } = useConfirmation();
  const [subjectName, setSubjectName] = useState('');
  const [open, setOpen] = useState(true);
  async function removeGroup() {
    if (
      await confirm({
        title: `Remove ${group.name}?`,
        description: 'All subjects and content in this group will be removed when you save.',
        confirmLabel: 'Remove group',
      })
    )
      onRemove();
  }
  function addSubject() {
    const name = subjectName.trim();
    if (!name) return;
    onChange({ ...group, subjects: [...group.subjects, { subjectName: name, content: '' }] });
    setSubjectName('');
  }
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <summary className="cursor-pointer px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
        <span className="font-semibold">{group.name}</span>
        <span className="ml-2 text-sm text-muted-foreground">{group.subjects.length} subjects</span>
      </summary>
      <div className="space-y-5 border-t border-border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Group name
            <input
              className="field"
              required
              maxLength={160}
              value={group.name}
              onChange={(event) => onChange({ ...group, name: event.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="button-secondary grid h-10 w-10 place-items-center p-0"
              aria-label="Move group up"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="button-secondary grid h-10 w-10 place-items-center p-0"
              aria-label="Move group down"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="button-secondary grid h-10 w-10 place-items-center p-0 text-destructive"
              aria-label={`Remove ${group.name}`}
              onClick={removeGroup}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Add a subject
            <input
              className="field"
              list={suggestionListId}
              value={subjectName}
              maxLength={160}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="Select an existing subject or type a custom name"
            />
            <datalist id={suggestionListId}>
              {subjectSuggestions.map((item) => (
                <option key={item.id} value={String(item.name)} />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            className="button-secondary inline-flex items-center justify-center gap-2"
            disabled={!subjectName.trim()}
            onClick={addSubject}
          >
            <Plus size={16} /> Add subject
          </button>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {group.subjects.map((subject, subjectIndex) => (
            <SubjectEditor
              key={subjectIndex}
              subject={subject}
              onChange={(next) =>
                onChange({
                  ...group,
                  subjects: group.subjects.map((item, itemIndex) =>
                    itemIndex === subjectIndex ? next : item,
                  ),
                })
              }
              onRemove={() =>
                onChange({
                  ...group,
                  subjects: group.subjects.filter((_, itemIndex) => itemIndex !== subjectIndex),
                })
              }
            />
          ))}
          {!group.subjects.length ? (
            <p className="p-5 text-sm text-muted-foreground">No subjects in this group yet.</p>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function SubjectEditor({
  subject,
  onChange,
  onRemove,
}: {
  subject: SyllabusGroup['subjects'][number];
  onChange: (subject: SyllabusGroup['subjects'][number]) => void;
  onRemove: () => void;
}) {
  const { confirm } = useConfirmation();
  async function removeSubject() {
    if (
      await confirm({
        title: `Remove ${subject.subjectName || 'this subject'}?`,
        description: 'Its syllabus content will be removed from this group when you save.',
        confirmLabel: 'Remove subject',
      })
    )
      onRemove();
  }
  return (
    <article className="grid gap-4 p-5">
      <div className="flex items-end gap-3">
        <label className="grid flex-1 gap-1 text-sm font-medium">
          Subject name
          <input
            className="field"
            required
            maxLength={160}
            value={subject.subjectName}
            onChange={(event) => onChange({ ...subject, subjectName: event.target.value })}
          />
        </label>
        <button
          type="button"
          className="button-secondary grid h-10 w-10 shrink-0 place-items-center p-0 text-destructive"
          aria-label={`Remove ${subject.subjectName}`}
          onClick={removeSubject}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <SyllabusContentEditor
        value={subject.content}
        onChange={(content) => onChange({ ...subject, content })}
      />
    </article>
  );
}
