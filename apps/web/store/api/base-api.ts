import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '@web/store';
import { setCredentials, signOut, type AuthenticatedUser } from '@web/store/slices/auth-slice';

export type ApiRecord = Record<string, unknown> & { id: string };
export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: unknown;
  errors?: unknown;
};
export const unwrap = <T>(response: ApiEnvelope<T>) => response.data;
export const queryString = (params: Record<string, string | number | boolean | undefined>) => {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) => {
    if (item !== undefined) value.set(key, String(item));
  });
  const result = value.toString();
  return result ? `?${result}` : '';
};

type SessionResponse = { accessToken: string; refreshToken: string; user?: AuthenticatedUser };
let refreshRequest: Promise<SessionResponse | null> | null = null;
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});
const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status !== 401 || url.startsWith('/auth/')) return result;
  const refreshToken = (api.getState() as RootState).auth.refreshToken;
  if (!refreshToken) {
    api.dispatch(signOut());
    return result;
  }
  refreshRequest ??= (async () => {
    const response = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
      api,
      extraOptions,
    );
    return 'data' in response ? (response.data as SessionResponse) : null;
  })().finally(() => {
    refreshRequest = null;
  });
  const refreshed = await refreshRequest;
  if (!refreshed?.accessToken) {
    api.dispatch(signOut());
    return result;
  }
  api.dispatch(setCredentials(refreshed));
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Session', 'Organization', 'Branch', 'Academic'],
  endpoints: () => ({}),
});
