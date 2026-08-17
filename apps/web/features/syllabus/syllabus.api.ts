import { baseApi, unwrap } from '@web/store/api/base-api';

export type SyllabusSubject = { subjectName: string; content: string };
export type SyllabusGroup = { name: string; subjects: SyllabusSubject[] };
export type SyllabusClass = { className: string; groups: SyllabusGroup[] };
export type SessionSyllabusSummary = {
  id: string;
  sessionYear: string;
  createdAt: string;
  updatedAt: string;
};
export type SessionSyllabus = SessionSyllabusSummary & { classes: SyllabusClass[] };

export const syllabusApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSyllabusSessions: build.query<SessionSyllabusSummary[], void>({
      query: () => '/syllabi',
      transformResponse: unwrap,
      providesTags: ['Syllabus'],
    }),
    getSessionSyllabus: build.query<SessionSyllabus, string>({
      query: (id) => `/syllabi/${id}`,
      transformResponse: unwrap,
      providesTags: ['Syllabus'],
    }),
    createSessionSyllabus: build.mutation<
      SessionSyllabus,
      { sessionYear: string; classes: SyllabusClass[] }
    >({
      query: (body) => ({ url: '/syllabi', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Syllabus'],
    }),
    updateSessionSyllabus: build.mutation<
      SessionSyllabus,
      { id: string; expectedUpdatedAt: string; classes: SyllabusClass[] }
    >({
      query: ({ id, ...body }) => ({ url: `/syllabi/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Syllabus'],
    }),
    deleteSessionSyllabus: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/syllabi/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Syllabus'],
    }),
  }),
});

export const {
  useListSyllabusSessionsQuery,
  useGetSessionSyllabusQuery,
  useCreateSessionSyllabusMutation,
  useUpdateSessionSyllabusMutation,
  useDeleteSessionSyllabusMutation,
} = syllabusApi;
