import { AdmissionReviewScreen } from '@web/features/admissions';

export default async function ReviewAdmissionPage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  return <AdmissionReviewScreen admissionId={admissionId} />;
}
