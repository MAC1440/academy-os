import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';
type StaffInput = {
  fullName: string;
  contactNumber: string;
  email?: string;
  staffType?: string;
  designation?: string;
  branchIds?: string[];
  roleId?: string;
  status?: string;
};
export const staffApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStaff: build.query<ApiRecord[], void>({
      query: () => '/staff',
      transformResponse: unwrap,
      providesTags: ['Branch'],
    }),
    getStaff: build.query<ApiRecord, string>({
      query: (id) => `/staff/${id}`,
      transformResponse: unwrap,
    }),
    getTemporaryStaffCredentials: build.query<ApiRecord, string>({
      query: (id) => `/staff/${id}/temporary-credentials`,
      transformResponse: unwrap,
    }),
    createStaff: build.mutation<ApiRecord, StaffInput>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Branch'],
    }),
    updateStaff: build.mutation<ApiRecord, { id: string; body: Partial<StaffInput> }>({
      query: ({ id, body }) => ({ url: `/staff/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Branch'],
    }),
    deleteStaff: build.mutation<ApiRecord, string>({
      query: (id) => ({ url: `/staff/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Branch'],
    }),
    resetStaffPin: build.mutation<ApiRecord, string>({
      query: (id) => ({ url: `/staff/${id}/reset-pin`, method: 'POST' }),
      transformResponse: unwrap,
    }),
    resetStaffPassword: build.mutation<ApiRecord, string>({
      query: (id) => ({ url: `/staff/${id}/reset-password`, method: 'POST' }),
      transformResponse: unwrap,
    }),
  }),
});
export const {
  useListStaffQuery,
  useGetStaffQuery,
  useGetTemporaryStaffCredentialsQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useResetStaffPinMutation,
  useResetStaffPasswordMutation,
} = staffApi;
