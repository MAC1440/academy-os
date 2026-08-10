import { baseApi, queryString, type ApiRecord, unwrap } from '@web/store/api/base-api';

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStudents: build.query<ApiRecord[], { branchId?: string } | void>({
      query: (params) => `/students${params ? queryString(params) : ''}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    getStudent: build.query<ApiRecord, string>({
      query: (studentId) => `/students/${studentId}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    updateStudent: build.mutation<
      ApiRecord,
      {
        studentId: string;
        body: Partial<{
          studentFullName: string;
          studentCnic: string;
          previousSchool: string;
          previousPerformance: string;
        }>;
      }
    >({
      query: ({ studentId, body }) => ({ url: `/students/${studentId}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
  }),
});

export const { useListStudentsQuery, useGetStudentQuery, useUpdateStudentMutation } = studentsApi;
