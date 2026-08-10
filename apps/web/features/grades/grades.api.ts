import { baseApi, type ApiRecord } from '@web/store/api/base-api';
type Mark = { studentId: string; subjectId: string; maximumMarks: number; obtainedMarks: number };
export const gradesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAssessments: build.query<ApiRecord[], string>({
      query: (offeringId) => `/academic-offerings/${offeringId}/assessments`,
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
    }),
    saveAssessmentMarks: build.mutation<{ saved: number }, { assessmentId: string; marks: Mark[] }>(
      {
        query: ({ assessmentId, marks }) => ({
          url: `/assessments/${assessmentId}/marks`,
          method: 'PUT',
          body: { marks },
        }),
      },
    ),
    getStudentPerformance: build.query<ApiRecord[], string>({
      query: (studentId) => `/students/${studentId}/performance`,
    }),
  }),
});
export const {
  useListAssessmentsQuery,
  useCreateAssessmentMutation,
  useSaveAssessmentMarksMutation,
  useGetStudentPerformanceQuery,
} = gradesApi;
