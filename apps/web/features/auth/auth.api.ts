import { baseApi } from '@web/store/api/base-api';
import type { AuthenticatedUser } from '@web/store/slices/auth-slice';
type Envelope<T> = { data: T };
type LoginInput = {
  identifier: string;
  password: string;
  accountType?: 'ADMIN' | 'STAFF' | 'LEARNER';
};
type LoginResponse = { accessToken: string; refreshToken: string; user: AuthenticatedUser };
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    me: build.query<AuthenticatedUser, void>({
      query: () => '/auth/me',
      transformResponse: (response: Envelope<AuthenticatedUser>) => response.data,
      providesTags: ['Session'],
    }),
    completeProfile: build.mutation<
      AuthenticatedUser,
      {
        newPassword: string;
        username?: string;
        contactNumber?: string;
        fullName?: string;
        email?: string;
      }
    >({
      query: (body) => ({ url: '/auth/complete-profile', method: 'POST', body }),
      transformResponse: (response: Envelope<AuthenticatedUser>) => response.data,
      invalidatesTags: ['Session'],
    }),
    updateProfile: build.mutation<
      AuthenticatedUser,
      {
        username?: string;
        contactNumber?: string;
        fullName?: string;
        email?: string;
        newPassword?: string;
      }
    >({
      query: (body) => ({ url: '/auth/profile', method: 'PATCH', body }),
      transformResponse: (response: Envelope<AuthenticatedUser>) => response.data,
      invalidatesTags: ['Session'],
    }),
  }),
});
export const {
  useLoginMutation,
  useMeQuery,
  useCompleteProfileMutation,
  useUpdateProfileMutation,
} = authApi;
