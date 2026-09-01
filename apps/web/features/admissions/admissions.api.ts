import { baseApi, type ApiRecord, queryString, unwrap } from '@web/store/api/base-api';
import type { Admission, AdmissionInput, ReviewAdmissionInput } from './admissions.types';
export type PublicAdmissionOptions = {
  enabled: boolean;
  isOpen: boolean;
  heading: string;
  description: string;
  confirmationMessage: string;
  offerings: Array<{ id: string; name: string; sectionName?: string | null; branchName: string }>;
};
export type WebsiteAdmissionInput = {
  academicOfferingId: string;
  studentFullName: string;
  studentCnic: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  guardianFullName: string;
  relationship: string;
  guardianPhone: string;
  alternatePhone?: string;
  email?: string;
  previousSchool?: string;
  previousClass?: string;
  address: string;
  notes?: string;
  website?: string;
};
export const admissionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicAdmissionOptions: build.query<PublicAdmissionOptions, void>({
      query: () => '/public/website/admissions',
      transformResponse: unwrap,
    }),
    submitWebsiteAdmission: build.mutation<{ id: string; message: string }, WebsiteAdmissionInput>({
      query: (body) => ({ url: '/public/website/admissions', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    submitAdmission: build.mutation<Admission, AdmissionInput>({
      query: (body) => ({ url: '/public/admissions', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listAdmissions: build.query<Admission[], { status?: string; branchId?: string } | void>({
      query: (params) => `/admissions${params ? queryString(params) : ''}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    getAdmission: build.query<Admission, string>({
      query: (id) => `/admissions/${id}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    updateAdmission: build.mutation<Admission, { id: string; body: Partial<AdmissionInput> }>({
      query: ({ id, body }) => ({ url: `/admissions/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    reviewAdmission: build.mutation<ApiRecord, { id: string; body: ReviewAdmissionInput }>({
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
  useGetPublicAdmissionOptionsQuery,
  useSubmitWebsiteAdmissionMutation,
  useSubmitAdmissionMutation,
  useListAdmissionsQuery,
  useGetAdmissionQuery,
  useUpdateAdmissionMutation,
  useReviewAdmissionMutation,
  useDeleteAdmissionMutation,
} = admissionsApi;
