'use client';

import { useRef } from 'react';
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
      <div
        className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-2"
        aria-label="Formatting tools"
      >
        <FormatButton label="Bold" onClick={() => insert('**', '**')} />
        <FormatButton label="Italic" onClick={() => insert('_', '_')} />
        <FormatButton label="Heading" onClick={() => insert('## ')} />
        <FormatButton label="Bullets" onClick={() => insert('- ')} />
        <FormatButton label="Numbers" onClick={() => insert('1. ')} />
      </div>
      <textarea
        ref={inputRef}
        className="field min-h-52 resize-y leading-6"
        value={value}
        maxLength={SYLLABUS_CONTENT_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add chapters, topics, grammar, revision work, or assessment coverage…"
      />
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
