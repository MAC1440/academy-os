import { AdmissionDetailScreen } from '@web/features/admissions';

export default async function AdmissionPage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  return <AdmissionDetailScreen admissionId={admissionId} />;
}
