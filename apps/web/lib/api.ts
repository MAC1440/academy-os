import type { ApiResponse, Academy, Branch, PaginationMeta } from "@academy-os/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json()) as ApiResponse<T> & {
    message?: string | string[];
    statusCode?: number;
  };

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message ?? "Request failed";
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    throw new ApiError(message, response.status);
  }

  return body;
}

export type AuthenticatedUser = {
  id: string;
  email: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
};

export async function login(credentials: { email: string; password: string }) {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return response as unknown as LoginResponse;
}

export async function getCurrentUser() {
  const response = await apiFetch<{ user: AuthenticatedUser }>("/auth/me");
  return (response as unknown as { user: AuthenticatedUser }).user;
}

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type OrganizationMember = {
  id: string;
  isOwner: boolean;
  status: "ACTIVE" | "INACTIVE";
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
  branchAssignments: Array<{
    id: string;
    branch: { id: string; name: string; status: string };
  }>;
};

export async function listAcademies(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);

  const response = await apiFetch<Academy[]>(
    `/organizations?${query.toString()}`,
  );
  return {
    items: response.data,
    meta: response.meta!,
  };
}

export async function getAcademy(id: string) {
  const response = await apiFetch<
    Academy & { branches?: Branch[]; _count?: { branches: number } }
  >(`/organizations/${id}`);
  return response.data;
}

export async function createAcademy(data: {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  timezone?: string;
  currency?: string;
}) {
  const response = await apiFetch<Academy>("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateAcademy(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    email: string;
    phone: string;
    website: string;
    logo: string;
    timezone: string;
    currency: string;
    status: string;
  }>,
) {
  const response = await apiFetch<Academy>(`/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteAcademy(id: string) {
  await apiFetch<{ id: string }>(`/organizations/${id}`, { method: "DELETE" });
}

export async function listOrganizationMembers(academyId: string) {
  const response = await apiFetch<OrganizationMember[]>(
    `/organizations/${academyId}/memberships`,
  );
  return response.data;
}

export async function addOrganizationMember(
  academyId: string,
  data: { email: string; branchIds: string[] },
) {
  const response = await apiFetch<OrganizationMember>(
    `/organizations/${academyId}/memberships`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}

export async function updateOrganizationMemberBranches(
  academyId: string,
  membershipId: string,
  branchIds: string[],
) {
  const response = await apiFetch<OrganizationMember>(
    `/organizations/${academyId}/memberships/${membershipId}/branches`,
    { method: "PATCH", body: JSON.stringify({ branchIds }) },
  );
  return response.data;
}

export async function listBranches(params: {
  page?: number;
  limit?: number;
  search?: string;
  academyId?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.academyId) query.set("academyId", params.academyId);

  const response = await apiFetch<
    (Branch & { academy?: { id: string; name: string; slug: string } })[]
  >(`/branches?${query.toString()}`);

  return {
    items: response.data,
    meta: response.meta!,
  };
}

export async function getBranch(id: string) {
  const response = await apiFetch<
    Branch & { academy?: { id: string; name: string; slug: string } }
  >(`/branches/${id}`);
  return response.data;
}

export async function createBranch(data: {
  academyId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: string;
}) {
  const response = await apiFetch<Branch>("/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateBranch(
  id: string,
  data: Partial<{
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    status: string;
  }>,
) {
  const response = await apiFetch<Branch>(`/branches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteBranch(id: string) {
  await apiFetch<{ id: string }>(`/branches/${id}`, { method: "DELETE" });
}

export { API_URL };

