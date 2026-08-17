'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

export function NoteRichText({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm italic text-muted-foreground">Nothing has been written yet.</p>;
  }

  return (
    <div className="prose max-w-none whitespace-pre-wrap text-foreground dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-teal-600">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
