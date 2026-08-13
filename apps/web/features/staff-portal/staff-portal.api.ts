import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';

export const staffPortalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStaffPortalOverview: build.query<ApiRecord, void>({
      query: () => '/staff/portal/overview',
      transformResponse: unwrap,
    }),
    listStaffAnnouncements: build.query<ApiRecord[], void>({
      query: () => '/announcements/staff',
      transformResponse: unwrap,
    }),
    listStaffNotes: build.query<ApiRecord[], void>({
      query: () => '/notes/staff',
      transformResponse: unwrap,
    }),
  }),
});

export const {
  useGetStaffPortalOverviewQuery,
  useListStaffAnnouncementsQuery,
  useListStaffNotesQuery,
} = staffPortalApi;
