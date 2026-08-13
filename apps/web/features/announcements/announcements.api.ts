import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';

type AnnouncementInput = {
  title: string;
  content: string;
  audience: 'ALL' | 'LEARNER' | 'STAFF';
  eventDate?: string;
};

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAnnouncements: build.query<ApiRecord[], void>({
      query: () => '/announcements',
      transformResponse: unwrap,
      providesTags: ['Organization'],
    }),
    createAnnouncement: build.mutation<ApiRecord, AnnouncementInput>({
      query: (body) => ({ url: '/announcements', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Organization'],
    }),
    updateAnnouncement: build.mutation<ApiRecord, { id: string; body: Partial<AnnouncementInput> }>(
      {
        query: ({ id, body }) => ({ url: `/announcements/${id}`, method: 'PATCH', body }),
        transformResponse: unwrap,
        invalidatesTags: ['Organization'],
      },
    ),
    deleteAnnouncement: build.mutation<ApiRecord, string>({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Organization'],
    }),
  }),
});

export const {
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementsApi;
