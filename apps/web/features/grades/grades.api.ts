import { baseApi, type ApiRecord } from '@web/store/api/base-api';
type Mark = { studentId: string; subjectId: string; maximumMarks: number; obtainedMarks: number };
export const gradesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAssessments: build.query<ApiRecord[], string>({
      query: (offeringId) => `/academic-offerings/${offeringId}/assessments`,
      providesTags: ['Academic'],
    }),
    createAssessment: build.mutation<
      ApiRecord,
      { offeringId: string; title: string; assessmentType: 'REGULAR' | 'FESTIVAL'; heldOn: string }
    >({
      query: ({ offeringId, ...body }) => ({
        url: `/academic-offerings/${offeringId}/assessments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Academic'],
    }),
    updateAssessment: build.mutation<
      ApiRecord,
      {
        assessmentId: string;
        title?: string;
        assessmentType?: 'REGULAR' | 'FESTIVAL';
        heldOn?: string;
      }
    >({
      query: ({ assessmentId, ...body }) => ({
        url: `/assessments/${assessmentId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Academic'],
    }),
    deleteAssessment: build.mutation<void, string>({
      query: (assessmentId) => ({ url: `/assessments/${assessmentId}`, method: 'DELETE' }),
      invalidatesTags: ['Academic'],
    }),
    getAssessmentMarks: build.query<ApiRecord[], string>({
      query: (assessmentId) => `/assessments/${assessmentId}/marks`,
      providesTags: ['Academic'],
    }),
    saveAssessmentMarks: build.mutation<{ saved: number }, { assessmentId: string; marks: Mark[] }>(
      {
        query: ({ assessmentId, marks }) => ({
          url: `/assessments/${assessmentId}/marks`,
          method: 'PUT',
          body: { marks },
        }),
        invalidatesTags: ['Academic'],
      },
    ),
    getStudentPerformance: build.query<ApiRecord[], string>({
      query: (studentId) => `/students/${studentId}/performance`,
      providesTags: ['Academic'],
    }),
  }),
});
export const {
  useListAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetAssessmentMarksQuery,
  useSaveAssessmentMarksMutation,
  useGetStudentPerformanceQuery,
} = gradesApi;
