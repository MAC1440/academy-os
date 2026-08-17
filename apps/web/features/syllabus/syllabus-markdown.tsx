'use client';

import { Eye, Pencil } from 'lucide-react';
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

export const SYLLABUS_CONTENT_MAX_LENGTH = 2_000_000;

export function SyllabusContentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>(value.trim() ? 'preview' : 'write');
  function insert(before: string, after = '') {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const selection = value.slice(start, end) || 'text';
    onChange(`${value.slice(0, start)}${before}${selection}${after}${value.slice(end)}`);
    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + before.length, start + before.length + selection.length);
    });
  }
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2" aria-label="Content mode">
          <button
            type="button"
            className={
              mode === 'preview'
                ? 'button-primary px-3 py-2 text-xs'
                : 'button-secondary px-3 py-2 text-xs'
            }
            onClick={() => setMode('preview')}
          >
            <Eye size={14} className="mr-1 inline" /> Preview
          </button>
          <button
            type="button"
            className={
              mode === 'write'
                ? 'button-primary px-3 py-2 text-xs'
                : 'button-secondary px-3 py-2 text-xs'
            }
            onClick={() => setMode('write')}
          >
            <Pencil size={14} className="mr-1 inline" /> Edit content
          </button>
        </div>
        {mode === 'write' ? (
          <div className="flex flex-wrap gap-2" aria-label="Formatting tools">
            <FormatButton label="Bold" onClick={() => insert('**', '**')} />
            <FormatButton label="Italic" onClick={() => insert('_', '_')} />
            <FormatButton label="Heading" onClick={() => insert('## ')} />
            <FormatButton label="Bullets" onClick={() => insert('- ')} />
            <FormatButton label="Numbers" onClick={() => insert('1. ')} />
          </div>
        ) : null}
      </div>
      {mode === 'write' ? (
        <textarea
          ref={inputRef}
          className="field min-h-52 resize-y leading-6"
          value={value}
          maxLength={SYLLABUS_CONTENT_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Add chapters, topics, grammar, revision work, or assessment coverage…"
        />
      ) : (
        <div className="min-h-52 rounded-xl bg-muted/30 p-5">
          <SyllabusRichText content={value} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Markdown and mathematical notation are supported · {value.length.toLocaleString()}{' '}
        characters
      </p>
    </div>
  );
}

function FormatButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="button-secondary px-3 py-1.5 text-xs" onClick={onClick}>
      {label}
    </button>
  );
}

export function SyllabusRichText({ content }: { content: string }) {
  if (!content.trim())
    return <p className="text-sm italic text-muted-foreground">Not added yet.</p>;
  return (
    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
