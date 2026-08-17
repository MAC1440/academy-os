import { SyllabusDetailScreen } from '@web/features/syllabus';

export default async function SyllabusDetailPage({
  params,
}: {
  params: Promise<{ syllabusId: string }>;
}) {
  const { syllabusId } = await params;
  return <SyllabusDetailScreen syllabusId={syllabusId} />;
}
