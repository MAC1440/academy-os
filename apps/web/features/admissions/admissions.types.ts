import type { ApiRecord } from '@web/store/api/base-api';

export type AdmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdmissionOffering = ApiRecord & {
  sectionName?: string | null;
  schoolClass?: ApiRecord;
  course?: ApiRecord;
};

export type Admission = ApiRecord & {
  academicOfferingId: string;
  academicTermId?: string | null;
  branchId: string;
  studentFullName: string;
  studentCnic: string;
  guardianFullName: string;
  guardianContactNumber: string;
  previousSchool?: string | null;
  previousPerformance?: string | null;
  formData?: Record<string, unknown> | null;
  status: AdmissionStatus;
  reviewNote?: string | null;
  physicalDocumentsVerifiedAt?: string | null;
  physicalDocumentsVerificationNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: ApiRecord;
  academicOffering?: AdmissionOffering;
  academicTerm?: ApiRecord;
  student?: ApiRecord;
};

export type AdmissionInput = {
  academicOfferingId: string;
  studentFullName: string;
  studentCnic: string;
  guardianFullName: string;
  guardianContactNumber: string;
  previousSchool?: string;
  previousPerformance?: string;
  formData?: Record<string, unknown>;
};

export type ReviewAdmissionInput = {
  status: 'APPROVED' | 'REJECTED';
  academicOfferingId?: string;
  academicTermId?: string;
  reviewNote?: string;
  monthlyFeeAmount?: number;
  amountReceivedWithForm?: number;
  openingBalanceAmount?: number;
  receiptNumber?: string;
  balanceDueOn?: string;
  physicalDocumentsVerified?: boolean;
  physicalDocumentsVerificationNote?: string;
};

export function offeringName(admission: Admission) {
  const offering = admission.academicOffering;
  const name = String(offering?.schoolClass?.name ?? offering?.course?.name ?? 'Offering');
  return offering?.sectionName ? `${name} · Section ${offering.sectionName}` : name;
}
