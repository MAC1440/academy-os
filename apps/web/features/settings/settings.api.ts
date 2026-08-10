import { baseApi, type ApiRecord } from '@web/store/api/base-api';
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAcademicTerms: build.query<ApiRecord[], void>({
      query: () => '/settings/academic-terms',
      providesTags: ['Academic'],
    }),
    createAcademicTerm: build.mutation<
      ApiRecord,
      { name: string; termType: 'YEARLY' | 'SEMESTER'; startsOn: string; endsOn: string }
    >({
      query: (body) => ({ url: '/settings/academic-terms', method: 'POST', body }),
      invalidatesTags: ['Academic'],
    }),
    updateAcademicTerm: build.mutation<
      ApiRecord,
      {
        termId: string;
        body: Partial<{
          name: string;
          termType: 'YEARLY' | 'SEMESTER';
          startsOn: string;
          endsOn: string;
        }>;
      }
    >({
      query: ({ termId, body }) => ({
        url: `/settings/academic-terms/${termId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Academic'],
    }),
    getAdmissionRegistrationSettings: build.query<ApiRecord, void>({
      query: () => '/settings/admission-registration',
    }),
    updateAdmissionRegistrationSettings: build.mutation<
      ApiRecord,
      { prefix?: string; sequencePadding?: number; nextSequence?: number }
    >({ query: (body) => ({ url: '/settings/admission-registration', method: 'PATCH', body }) }),
  }),
});
export const {
  useListAcademicTermsQuery,
  useCreateAcademicTermMutation,
  useUpdateAcademicTermMutation,
  useGetAdmissionRegistrationSettingsQuery,
  useUpdateAdmissionRegistrationSettingsMutation,
} = settingsApi;
