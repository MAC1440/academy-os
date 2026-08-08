import { apiFetch } from "./client";

export type StaffProfile = {
  id: string;
  type: "TEACHER" | "STAFF";
  employeeCode: string | null;
  status: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  branchAssignments: Array<{ id: string; branch: { id: string; name: string } }>;
};

export async function listStaff(academyId: string) {
  const response = await apiFetch<StaffProfile[]>(
    `/organizations/${academyId}/staff`,
  );
  return response.data;
}

export async function createStaffProfile(
  academyId: string,
  data: {
    email: string;
    type: "TEACHER" | "STAFF";
    employeeCode?: string;
    pin: string;
    branchIds: string[];
  },
) {
  const response = await apiFetch<StaffProfile>(
    `/organizations/${academyId}/staff`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}
