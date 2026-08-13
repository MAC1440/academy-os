import { baseApi, type ApiRecord, queryString, unwrap } from '@web/store/api/base-api';
export const learnerPortalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listLinkedStudents: build.query<ApiRecord[], void>({
      query: () => '/learner-portal/students',
      transformResponse: unwrap,
    }),
    getLinkedStudentAttendance: build.query<
      ApiRecord[],
      { studentId: string; from?: string; to?: string }
    >({
      query: ({ studentId, ...range }) =>
        `/learner-portal/students/${studentId}/attendance${queryString(range)}`,
      transformResponse: unwrap,
    }),
    getLinkedStudentPerformance: build.query<ApiRecord[], string>({
      query: (studentId) => `/learner-portal/students/${studentId}/performance`,
      transformResponse: unwrap,
    }),
    getLinkedStudentFinance: build.query<ApiRecord, string>({
      query: (studentId) => `/learner-portal/students/${studentId}/finance`,
      transformResponse: unwrap,
    }),
    listLearnerAnnouncements: build.query<ApiRecord[], void>({
      query: () => '/announcements/learner',
      transformResponse: unwrap,
    }),
    listLearnerNotes: build.query<ApiRecord[], void>({
      query: () => '/notes/learner',
      transformResponse: unwrap,
    }),
  }),
});
export const {
  useListLinkedStudentsQuery,
  useGetLinkedStudentAttendanceQuery,
  useGetLinkedStudentPerformanceQuery,
  useGetLinkedStudentFinanceQuery,
  useListLearnerAnnouncementsQuery,
  useListLearnerNotesQuery,
} = learnerPortalApi;
