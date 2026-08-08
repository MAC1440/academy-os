import type { Branch } from "@academy-os/shared";
import { apiFetch } from "./client";

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

  return { items: response.data, meta: response.meta! };
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
