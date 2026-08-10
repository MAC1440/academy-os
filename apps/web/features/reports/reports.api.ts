import { baseApi, type ApiRecord, queryString } from '@web/store/api/base-api';
type DateRange = { from: string; to: string };
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStudentAttendanceReport: build.query<ApiRecord, { academicOfferingId: string } & DateRange>({
      query: (params) => `/reports/student-attendance${queryString(params)}`,
    }),
    getStudentAttendanceCsv: build.query<string, { academicOfferingId: string } & DateRange>({
      query: (params) => ({
        url: `/reports/student-attendance.csv${queryString(params)}`,
        responseHandler: 'text',
      }),
    }),
    getStaffAttendanceReport: build.query<ApiRecord[], { branchId: string } & DateRange>({
      query: (params) => `/reports/staff-attendance${queryString(params)}`,
    }),
    getStaffAttendanceCsv: build.query<string, { branchId: string } & DateRange>({
      query: (params) => ({
        url: `/reports/staff-attendance.csv${queryString(params)}`,
        responseHandler: 'text',
      }),
    }),
  }),
});
export const {
  useGetStudentAttendanceReportQuery,
  useLazyGetStudentAttendanceCsvQuery,
  useGetStaffAttendanceReportQuery,
  useLazyGetStaffAttendanceCsvQuery,
} = reportsApi;
