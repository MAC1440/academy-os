export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type Academy = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  timezone: string;
  currency: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt?: string;
};

export type Branch = {
  id: string;
  academyId: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: PaginationMeta | null;
  errors: null;
};
