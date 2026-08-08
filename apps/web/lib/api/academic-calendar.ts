import { apiFetch } from "./client";

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
  academicYears: Array<{
    id: string;
    name: string;
    startsOn: string;
    endsOn: string;
    status: string;
  }>;
  weekdays: number[];
  calendarDays: Array<{
    id: string;
    date: string;
    type: "HOLIDAY" | "OFF_DAY";
    label: string;
  }>;
};

export async function getAcademicSettings(academyId: string) {
  const response = await apiFetch<AcademicSettings>(
    `/organizations/${academyId}/academic-settings`,
  );
  return response.data;
}

export async function updateAcademicSettings(
  academyId: string,
  sectionsEnabled: boolean,
) {
  const response = await apiFetch<AcademicSettings>(
    `/organizations/${academyId}/academic-settings`,
    { method: "PATCH", body: JSON.stringify({ sectionsEnabled }) },
  );
  return response.data;
}

export async function listSchoolClasses(branchId: string) {
  const response = await apiFetch<SchoolClass[]>(
    `/branches/${branchId}/classes`,
  );
  return response.data;
}

export async function createSchoolClass(
  branchId: string,
  data: { name: string; code: string; sortOrder?: number },
) {
  const response = await apiFetch<SchoolClass>(
    `/branches/${branchId}/classes`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}

export async function deleteSchoolClass(id: string) {
  await apiFetch<{ id: string }>(`/school-classes/${id}`, {
    method: "DELETE",
  });
}

export async function createClassSection(
  schoolClassId: string,
  data: { name: string; code: string },
) {
  const response = await apiFetch<ClassSection>(
    `/school-classes/${schoolClassId}/sections`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}

export async function getAcademicCalendar(academyId: string) {
  const response = await apiFetch<AcademicCalendar>(
    `/organizations/${academyId}/academic-calendar`,
  );
  return response.data;
}

export async function createAcademicYear(
  academyId: string,
  data: { name: string; startsOn: string; endsOn: string },
) {
  const response = await apiFetch<AcademicCalendar["academicYears"][number]>(
    `/organizations/${academyId}/academic-calendar/years`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}

export async function updateWorkingDays(academyId: string, weekdays: number[]) {
  const response = await apiFetch<{ weekdays: number[] }>(
    `/organizations/${academyId}/academic-calendar/working-days`,
    { method: "PATCH", body: JSON.stringify({ weekdays }) },
  );
  return response.data;
}

export async function createCalendarDay(
  academyId: string,
  data: { date: string; type: "HOLIDAY" | "OFF_DAY"; label: string },
) {
  const response = await apiFetch<AcademicCalendar["calendarDays"][number]>(
    `/organizations/${academyId}/academic-calendar/days`,
    { method: "POST", body: JSON.stringify(data) },
  );
  return response.data;
}

export async function deleteCalendarDay(academyId: string, id: string) {
  await apiFetch<{ id: string }>(
    `/organizations/${academyId}/academic-calendar/days/${id}`,
    { method: "DELETE" },
  );
}
