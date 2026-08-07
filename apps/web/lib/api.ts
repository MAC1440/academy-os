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

export type AcademicSettings = {
  id: string;
  academyId: string;
  sectionsEnabled: boolean;
};

export type ClassSection = {
  id: string;
  name: string;
  code: string;
  status: string;
};

export type SchoolClass = {
  id: string;
  branchId: string;
  name: string;
  code: string;
  sortOrder: number;
  status: string;
  sections: ClassSection[];
};

export type AcademicCalendar = {
  academicYears: Array<{ id: string; name: string; startsOn: string; endsOn: string; status: string }>;
  weekdays: number[];
  calendarDays: Array<{ id: string; date: string; type: "HOLIDAY" | "OFF_DAY"; label: string }>;
};

export type StaffProfile = {
  id: string;
  type: "TEACHER" | "STAFF";
  employeeCode: string | null;
  status: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  branchAssignments: Array<{ id: string; branch: { id: string; name: string } }>;
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
  data: { fullName: string; email?: string; branchIds: string[] },
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

export async function getAcademicSettings(academyId: string) {
  const response = await apiFetch<AcademicSettings>(
    `/organizations/${academyId}/academic-settings`,
  );
  return response.data;
}

export async function updateAcademicSettings(academyId: string, sectionsEnabled: boolean) {
  const response = await apiFetch<AcademicSettings>(
    `/organizations/${academyId}/academic-settings`,
    { method: "PATCH", body: JSON.stringify({ sectionsEnabled }) },
  );
  return response.data;
}

export async function listSchoolClasses(branchId: string) {
  const response = await apiFetch<SchoolClass[]>(`/branches/${branchId}/classes`);
  return response.data;
}

export async function createSchoolClass(
  branchId: string,
  data: { name: string; code: string; sortOrder?: number },
) {
  const response = await apiFetch<SchoolClass>(`/branches/${branchId}/classes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteSchoolClass(id: string) {
  await apiFetch<{ id: string }>(`/school-classes/${id}`, { method: "DELETE" });
}

export async function createClassSection(
  schoolClassId: string,
  data: { name: string; code: string },
) {
  const response = await apiFetch<ClassSection>(`/school-classes/${schoolClassId}/sections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function getAcademicCalendar(academyId: string) {
  const response = await apiFetch<AcademicCalendar>(`/organizations/${academyId}/academic-calendar`);
  return response.data;
}

export async function createAcademicYear(academyId: string, data: { name: string; startsOn: string; endsOn: string }) {
  const response = await apiFetch<AcademicCalendar["academicYears"][number]>(`/organizations/${academyId}/academic-calendar/years`, { method: "POST", body: JSON.stringify(data) });
  return response.data;
}

export async function updateWorkingDays(academyId: string, weekdays: number[]) {
  const response = await apiFetch<{ weekdays: number[] }>(`/organizations/${academyId}/academic-calendar/working-days`, { method: "PATCH", body: JSON.stringify({ weekdays }) });
  return response.data;
}

export async function createCalendarDay(academyId: string, data: { date: string; type: "HOLIDAY" | "OFF_DAY"; label: string }) {
  const response = await apiFetch<AcademicCalendar["calendarDays"][number]>(`/organizations/${academyId}/academic-calendar/days`, { method: "POST", body: JSON.stringify(data) });
  return response.data;
}

export async function deleteCalendarDay(academyId: string, id: string) {
  await apiFetch<{ id: string }>(`/organizations/${academyId}/academic-calendar/days/${id}`, { method: "DELETE" });
}

export async function listStaff(academyId: string) {
  const response = await apiFetch<StaffProfile[]>(`/organizations/${academyId}/staff`);
  return response.data;
}

export async function createStaffProfile(academyId: string, data: { email: string; type: "TEACHER" | "STAFF"; employeeCode?: string; pin: string; branchIds: string[] }) {
  const response = await apiFetch<StaffProfile>(`/organizations/${academyId}/staff`, { method: "POST", body: JSON.stringify(data) });
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

