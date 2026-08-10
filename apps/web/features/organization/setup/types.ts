import type { ApiRecord } from '@web/store/api/base-api';
export type Organization = ApiRecord & {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};
export type Branch = ApiRecord & {
  name?: string;
  address?: string;
  city?: string | null;
  phone?: string | null;
};
