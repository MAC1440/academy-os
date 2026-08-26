import { AdmissionEditScreen } from '@web/features/admissions';

export default async function EditAdmissionPage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  return <AdmissionEditScreen admissionId={admissionId} />;
}
