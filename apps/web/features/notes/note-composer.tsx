'use client';

import { ChangeEvent, RefObject, useRef, useState } from 'react';
import { FileUp, LoaderCircle, Sigma } from 'lucide-react';

type NoteFields = { title: string; content: string };
export const NOTE_CONTENT_MAX_LENGTH = 2_000_000;

export function NoteComposer({
  form,
  onChange,
  contentRef,
  onValidationError,
}: {
  form: NoteFields;
  onChange: (next: NoteFields) => void;
  contentRef: RefObject<HTMLTextAreaElement | null>;
  onValidationError: (message: string) => void;
}) {
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  function insert(before: string, after = '') {
    const input = contentRef.current;
    const start = input?.selectionStart ?? form.content.length;
    const end = input?.selectionEnd ?? start;
    const selected = form.content.slice(start, end);
    const next = `${form.content.slice(0, start)}${before}${selected || 'text'}${after}${form.content.slice(end)}`;
    onChange({ ...form, content: next });
    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(
        start + before.length,
        start + before.length + (selected || 'text').length,
      );
    });
  }
  async function importText(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      let extracted = '';
      if (file.type.startsWith('image/')) {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const result = await worker.recognize(file);
        extracted = result.data.text;
        await worker.terminate();
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const mammoth = await import('mammoth');
        extracted = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, offset) => {
            const page = await pdf.getPage(offset + 1);
            const content = await page.getTextContent();
            return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
          }),
        );
        extracted = pages.join('\n\n');
      } else throw new Error('Unsupported format');
      if (!extracted.trim()) throw new Error('No text found');
      const normalized = extracted.trim();
      const combined = form.content ? `${form.content}\n\n${normalized}` : normalized;
      if (combined.length > NOTE_CONTENT_MAX_LENGTH) {
        onValidationError(
          `This import would make the note ${combined.length.toLocaleString()} characters. Notes can contain up to ${NOTE_CONTENT_MAX_LENGTH.toLocaleString()} characters. Split the document and try again.`,
        );
        return;
      }
      onChange({ ...form, content: combined });
    } catch {
      onValidationError(
        'Text could not be extracted. Use a clear image, text-based PDF, or DOCX file.',
      );
    } finally {
      setExtracting(false);
      event.target.value = '';
    }
  }
  return (
    <>
      <label className="grid gap-1 text-sm font-medium">
        Title
        <input
          className="field"
          required
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          placeholder="e.g. Saturday mock test"
        />
      </label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-2">
        <button type="button" className="button-secondary" onClick={() => insert('**', '**')}>
          Bold
        </button>
        <button type="button" className="button-secondary" onClick={() => insert('## ')}>
          Heading
        </button>
        <button type="button" className="button-secondary" onClick={() => insert('- ')}>
          List
        </button>
        <button
          type="button"
          className="button-secondary inline-flex items-center gap-1"
          onClick={() => insert('$', '$')}
        >
          <Sigma size={14} /> Math
        </button>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={importText}
        />
        <button
          type="button"
          className="button-secondary inline-flex items-center gap-1"
          disabled={extracting}
          onClick={() => inputRef.current?.click()}
        >
          {extracting ? <LoaderCircle className="animate-spin" size={14} /> : <FileUp size={14} />}
          {extracting ? 'Extracting...' : 'Import text'}
        </button>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Note{' '}
        <span className="font-normal text-muted-foreground">
          Markdown supported. Use $x^2$ for inline math or $$...$$ for a math block.
        </span>
        <textarea
          ref={contentRef}
          className="field min-h-40 resize-y"
          required
          value={form.content}
          onChange={(event) => onChange({ ...form, content: event.target.value })}
          placeholder="Write the details your team needs."
          aria-invalid={form.content.length > NOTE_CONTENT_MAX_LENGTH}
        />
        <span
          className={`text-xs ${form.content.length > NOTE_CONTENT_MAX_LENGTH ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}
        >
          {form.content.length.toLocaleString()} / {NOTE_CONTENT_MAX_LENGTH.toLocaleString()}
          {form.content.length > NOTE_CONTENT_MAX_LENGTH
            ? ' — shorten this note before saving.'
            : ' characters'}
        </span>
      </label>
    </>
  );
}
