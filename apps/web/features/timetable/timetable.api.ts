import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';

export type TimetableSlotInput = {
  weekday?: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  slotType: 'ASSEMBLY' | 'TEACHING' | 'BREAK';
  periodNumber?: number;
  startsAt: string;
  endsAt: string;
};
export const timetableApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTimetableProfiles: build.query<ApiRecord[], string>({
      query: (branchId) => `/branches/${branchId}/timetable-profiles`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createTimetableProfile: build.mutation<
      ApiRecord,
      { branchId: string; body: Record<string, unknown> }
    >({
      query: ({ branchId, body }) => ({
        url: `/branches/${branchId}/timetable-profiles`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateTimetableProfile: build.mutation<
      ApiRecord,
      { profileId: string; body: Record<string, unknown> }
    >({
      query: ({ profileId, body }) => ({
        url: `/timetable-profiles/${profileId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    setTimetableProfileActive: build.mutation<ApiRecord, { profileId: string; isActive: boolean }>({
      query: ({ profileId, isActive }) => ({
        url: `/timetable-profiles/${profileId}/active`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteTimetableProfile: build.mutation<ApiRecord, string>({
      query: (profileId) => ({ url: `/timetable-profiles/${profileId}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    getClassTimetable: build.query<ApiRecord, string>({
      query: (offeringId) => `/academic-offerings/${offeringId}/timetable`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    saveTimetableAssignments: build.mutation<
      ApiRecord,
      {
        offeringId: string;
        profileId: string;
        assignments: Record<string, unknown>[];
        replaceTeacherConflicts?: boolean;
      }
    >({
      query: ({ offeringId, profileId, assignments, replaceTeacherConflicts }) => ({
        url: `/academic-offerings/${offeringId}/timetable/${profileId}/assignments`,
        method: 'PUT',
        body: { assignments, replaceTeacherConflicts },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    getMyTimetable: build.query<ApiRecord[], void>({
      query: () => '/timetable/staff/my-timetable',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
  }),
});
export const {
  useListTimetableProfilesQuery,
  useCreateTimetableProfileMutation,
  useUpdateTimetableProfileMutation,
  useSetTimetableProfileActiveMutation,
  useDeleteTimetableProfileMutation,
  useGetClassTimetableQuery,
  useSaveTimetableAssignmentsMutation,
  useGetMyTimetableQuery,
} = timetableApi;
