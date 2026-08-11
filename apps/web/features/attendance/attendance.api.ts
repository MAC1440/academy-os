import { baseApi, type ApiRecord, queryString, unwrap } from '@web/store/api/base-api';
type AttendanceRecord = { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' };
export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStudentAttendanceRoster: build.query<ApiRecord[], { offeringId: string; date: string }>({
      query: ({ offeringId, date }) =>
        `/academic-offerings/${offeringId}/student-attendance${queryString({ date })}`,
      transformResponse: unwrap,
    }),
    saveStudentAttendance: build.mutation<
      ApiRecord[],
      { offeringId: string; attendanceDate: string; records: AttendanceRecord[] }
    >({
      query: ({ offeringId, ...body }) => ({
        url: `/academic-offerings/${offeringId}/student-attendance`,
        method: 'PUT',
        body,
      }),
      transformResponse: unwrap,
    }),
  }),
});
export const {
  useGetStudentAttendanceRosterQuery,
  useLazyGetStudentAttendanceRosterQuery,
  useSaveStudentAttendanceMutation,
} = attendanceApi;
