import { baseApi, type ApiRecord, queryString, unwrap } from '@web/store/api/base-api';
import type { Admission, AdmissionInput, ReviewAdmissionInput } from './admissions.types';
export const admissionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
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
  useSubmitAdmissionMutation,
  useListAdmissionsQuery,
  useGetAdmissionQuery,
  useUpdateAdmissionMutation,
  useReviewAdmissionMutation,
  useDeleteAdmissionMutation,
} = admissionsApi;
