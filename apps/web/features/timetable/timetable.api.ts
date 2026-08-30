import { baseApi, queryString, type ApiRecord, unwrap } from '@web/store/api/base-api';

export type TimetableWeekday =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type TimetableScope = 'ORGANIZATION' | 'BRANCH' | 'CLASS_OVERRIDE';
export type TimetableMode = 'SAME_DAILY' | 'DAY_SPECIFIC';
export type TimetableSlotInput = {
  id?: string;
  weekday?: TimetableWeekday;
  slotType: 'ASSEMBLY' | 'TEACHING' | 'BREAK';
  periodNumber?: number;
  startsAt: string;
  endsAt: string;
};
export type TimetableProfile = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  academicOfferingId?: string | null;
  name: string;
  scope: TimetableScope;
  timetableMode: TimetableMode;
  isActive: boolean;
  slots: TimetableSlotInput[];
  branch?: ApiRecord | null;
  academicOffering?: ApiRecord | null;
  _count?: { assignments: number };
};
export type ClassTimetable = {
  offering: ApiRecord;
  profile: TimetableProfile;
  rows: Array<TimetableSlotInput & { id: string; assignment?: ApiRecord | null }>;
};
export type TimetableProfilePayload = {
  name: string;
  scope: TimetableScope;
  branchId?: string;
  academicOfferingId?: string;
  timetableMode: TimetableMode;
  slots: TimetableSlotInput[];
};

export const timetableApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAllTimetableProfiles: build.query<TimetableProfile[], void>({
      query: () => '/timetable-profiles',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    listTimetableProfiles: build.query<TimetableProfile[], string>({
      query: (branchId) => `/branches/${branchId}/timetable-profiles`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    getTimetableProfile: build.query<TimetableProfile, string>({
      query: (profileId) => `/timetable-profiles/${profileId}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createOrganizationTimetableProfile: build.mutation<TimetableProfile, TimetableProfilePayload>({
      query: (body) => ({ url: '/timetable-profiles', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    createTimetableProfile: build.mutation<
      TimetableProfile,
      { branchId: string; body: TimetableProfilePayload }
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
      TimetableProfile,
      { profileId: string; body: Partial<TimetableProfilePayload> }
    >({
      query: ({ profileId, body }) => ({
        url: `/timetable-profiles/${profileId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    setTimetableProfileActive: build.mutation<
      TimetableProfile,
      { profileId: string; isActive: boolean }
    >({
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
    getClassTimetable: build.query<ClassTimetable, string>({
      query: (offeringId) => `/academic-offerings/${offeringId}/timetable`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    saveTimetableAssignments: build.mutation<
      ClassTimetable,
      {
        offeringId: string;
        profileId: string;
        assignments: Array<{
          timetableSlotId: string;
          subjectId: string;
          staffProfileId: string;
        }>;
        clearedTimetableSlotIds: string[];
        replaceTeacherConflicts?: boolean;
      }
    >({
      query: ({
        offeringId,
        profileId,
        assignments,
        clearedTimetableSlotIds,
        replaceTeacherConflicts,
      }) => ({
        url: `/academic-offerings/${offeringId}/timetable/${profileId}/assignments`,
        method: 'PUT',
        body: { assignments, clearedTimetableSlotIds, replaceTeacherConflicts },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listDailyTimetableOverrides: build.query<ApiRecord[], { branchId: string; date: string }>({
      query: ({ branchId, date }) => `/timetable/daily-overrides${queryString({ branchId, date })}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createDailyTimetableOverride: build.mutation<
      ApiRecord,
      { timetableAssignmentId: string; overrideStaffProfileId: string; overrideDate: string }
    >({
      query: (body) => ({ url: '/timetable/daily-overrides', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteDailyTimetableOverride: build.mutation<ApiRecord, string>({
      query: (overrideId) => ({
        url: `/timetable/daily-overrides/${overrideId}`,
        method: 'DELETE',
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
  useListAllTimetableProfilesQuery,
  useListTimetableProfilesQuery,
  useGetTimetableProfileQuery,
  useCreateOrganizationTimetableProfileMutation,
  useCreateTimetableProfileMutation,
  useUpdateTimetableProfileMutation,
  useSetTimetableProfileActiveMutation,
  useDeleteTimetableProfileMutation,
  useGetClassTimetableQuery,
  useSaveTimetableAssignmentsMutation,
  useListDailyTimetableOverridesQuery,
  useCreateDailyTimetableOverrideMutation,
  useDeleteDailyTimetableOverrideMutation,
  useGetMyTimetableQuery,
} = timetableApi;
