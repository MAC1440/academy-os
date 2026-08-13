import { baseApi, type ApiRecord, queryString, unwrap } from '@web/store/api/base-api';
type AdmissionInput = {
  academicOfferingId: string;
  studentFullName: string;
  studentCnic: string;
  guardianFullName: string;
  guardianContactNumber: string;
  previousSchool?: string;
  previousPerformance?: string;
  formData?: Record<string, unknown>;
};
type ReviewInput = {
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
export const admissionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    submitAdmission: build.mutation<ApiRecord, AdmissionInput>({
      query: (body) => ({ url: '/public/admissions', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listAdmissions: build.query<ApiRecord[], { status?: string; branchId?: string } | void>({
      query: (params) => `/admissions${params ? queryString(params) : ''}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    getAdmission: build.query<ApiRecord, string>({
      query: (id) => `/admissions/${id}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    reviewAdmission: build.mutation<ApiRecord, { id: string; body: ReviewInput }>({
      query: ({ id, body }) => ({ url: `/admissions/${id}/review`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteAdmission: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admissions/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
  }),
});
export const {
  useSubmitAdmissionMutation,
  useListAdmissionsQuery,
  useGetAdmissionQuery,
  useReviewAdmissionMutation,
  useDeleteAdmissionMutation,
} = admissionsApi;
