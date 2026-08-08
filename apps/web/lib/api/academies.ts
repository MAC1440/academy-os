import type { Academy, Branch } from "@academy-os/shared";
import { apiFetch } from "./client";

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
  return { items: response.data, meta: response.meta! };
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
