import { baseApi, type ApiRecord } from '@web/store/api/base-api';
export const calendarApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCalendarDays: build.query<ApiRecord[], void>({ query: () => '/academic-calendar' }),
    saveCalendarDay: build.mutation<
      ApiRecord,
      { date: string; dayType: 'HOLIDAY' | 'OFF_DAY'; label?: string }
    >({ query: (body) => ({ url: '/academic-calendar', method: 'PUT', body }) }),
  }),
});
export const { useListCalendarDaysQuery, useSaveCalendarDayMutation } = calendarApi;
