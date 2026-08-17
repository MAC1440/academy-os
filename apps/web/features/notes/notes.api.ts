import { baseApi, unwrap } from '@web/store/api/base-api';

export type NotePerson = { id: string; fullName: string };
export type SharedNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: NotePerson;
  lastEditedBy?: NotePerson;
};

export const notesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotes: build.query<SharedNote[], void>({
      query: () => '/notes',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    getNote: build.query<SharedNote, string>({
      query: (id) => `/notes/${id}`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createNote: build.mutation<SharedNote, { title: string; content: string }>({
      query: (body) => ({ url: '/notes', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateNote: build.mutation<
      SharedNote,
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
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
