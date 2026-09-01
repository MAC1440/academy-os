'use client';
import { useParams } from 'next/navigation';
import { NewsArticlePage } from '@web/features/website/public-content-pages';
export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  return <NewsArticlePage slug={slug} />;
}
