'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WebsiteSurface } from './public-website';
import { useGetWebsitePreviewQuery } from './website.api';

export function WebsitePreview() {
  const preview = useGetWebsitePreviewQuery();
  if (preview.isLoading)
    return <p className="text-sm text-muted-foreground">Loading draft preview…</p>;
  if (preview.isError || !preview.data)
    return <p className="text-sm text-destructive">The draft preview could not be loaded.</p>;
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/website"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to Website Manager
      </Link>
      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <WebsiteSurface settings={preview.data.data} preview />
      </div>
    </div>
  );
}
