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

export function successResponse<T>(
  message: string,
  data: T,
  meta: PaginationMeta | null = null,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
    errors: null,
  };
}
