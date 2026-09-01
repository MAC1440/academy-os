'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { WebsiteSurface } from './public-website';
import { useGetWebsitePreviewQuery } from './website.api';

export function WebsitePreview() {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const preview = useGetWebsitePreviewQuery();
  if (preview.isLoading)
    return <p className="text-sm text-muted-foreground">Loading draft preview…</p>;
  if (preview.isError || !preview.data)
    return <p className="text-sm text-destructive">The draft preview could not be loaded.</p>;
  return (
    <div className="website-preview-workspace">
      <div className="website-preview-toolbar">
        <Link
          href="/dashboard/website"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Website Manager
        </Link>
        <div role="group" aria-label="Preview width">
          <button
            aria-pressed={viewport === 'desktop'}
            onClick={() => setViewport('desktop')}
            title="Desktop preview"
          >
            <Monitor size={16} />
            <span>Desktop</span>
          </button>
          <button
            aria-pressed={viewport === 'tablet'}
            onClick={() => setViewport('tablet')}
            title="Tablet preview"
          >
            <Tablet size={16} />
            <span>Tablet</span>
          </button>
          <button
            aria-pressed={viewport === 'mobile'}
            onClick={() => setViewport('mobile')}
            title="Mobile preview"
          >
            <Smartphone size={16} />
            <span>Mobile</span>
          </button>
        </div>
      </div>
      <div className="website-preview-stage">
        <div className={`website-preview-frame website-preview-${viewport}`}>
          <WebsiteSurface settings={preview.data.data} preview />
        </div>
      </div>
    </div>
  );
}
