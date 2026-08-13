import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';
export const notesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotes: build.query<ApiRecord[], void>({
      query: () => '/notes',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createNote: build.mutation<ApiRecord, { title: string; content: string }>({
      query: (body) => ({ url: '/notes', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateNote: build.mutation<
      ApiRecord,
      { id: string; body: { title?: string; content?: string } }
    >({
      query: ({ id, body }) => ({ url: `/notes/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteNote: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/notes/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
  }),
});
export const {
  useListNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
