import { baseApi, type ApiRecord, unwrap } from '@web/store/api/base-api';
type EntityInput = {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  sectionsEnabled?: boolean;
  status?: string;
};
type OfferingInput = {
  offeringType: 'SCHOOL_CLASS' | 'COURSE';
  schoolClassId?: string;
  courseId?: string;
  academicGroupId?: string;
  sectionName?: string;
  status?: string;
};
export const academicsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSchoolClasses: build.query<ApiRecord[], void>({
      query: () => '/school-classes',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createSchoolClass: build.mutation<ApiRecord, EntityInput>({
      query: (body) => ({ url: '/school-classes', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateSchoolClass: build.mutation<ApiRecord, { id: string; body: Partial<EntityInput> }>({
      query: ({ id, body }) => ({ url: `/school-classes/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listAcademicGroups: build.query<ApiRecord[], void>({
      query: () => '/academic-groups',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createAcademicGroup: build.mutation<
      ApiRecord,
      { name: string; code?: string; schoolClassIds: string[] }
    >({
      query: (body) => ({ url: '/academic-groups', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateAcademicGroup: build.mutation<ApiRecord, { id: string; body: Partial<EntityInput> }>({
      query: ({ id, body }) => ({ url: `/academic-groups/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    replaceAcademicGroupClasses: build.mutation<
      ApiRecord,
      { id: string; schoolClassIds: string[] }
    >({
      query: ({ id, schoolClassIds }) => ({
        url: `/academic-groups/${id}/school-classes`,
        method: 'PUT',
        body: { schoolClassIds },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteAcademicGroup: build.mutation<ApiRecord, string>({
      query: (id) => ({ url: `/academic-groups/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listCourses: build.query<ApiRecord[], void>({
      query: () => '/courses',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createCourse: build.mutation<ApiRecord, EntityInput>({
      query: (body) => ({ url: '/courses', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateCourse: build.mutation<ApiRecord, { id: string; body: Partial<EntityInput> }>({
      query: ({ id, body }) => ({ url: `/courses/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listSubjects: build.query<ApiRecord[], void>({
      query: () => '/subjects',
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createSubject: build.mutation<ApiRecord, EntityInput>({
      query: (body) => ({ url: '/subjects', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateSubject: build.mutation<ApiRecord, { id: string; body: Partial<EntityInput> }>({
      query: ({ id, body }) => ({ url: `/subjects/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    listOfferings: build.query<ApiRecord[], string>({
      query: (branchId) => `/branches/${branchId}/academic-offerings`,
      transformResponse: unwrap,
      providesTags: ['Academic'],
    }),
    createOffering: build.mutation<ApiRecord, { branchId: string; body: OfferingInput }>({
      query: ({ branchId, body }) => ({
        url: `/branches/${branchId}/academic-offerings`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    updateOffering: build.mutation<
      ApiRecord,
      { branchId: string; offeringId: string; body: Partial<OfferingInput> }
    >({
      query: ({ branchId, offeringId, body }) => ({
        url: `/branches/${branchId}/academic-offerings/${offeringId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    deleteOffering: build.mutation<ApiRecord, { branchId: string; offeringId: string }>({
      query: ({ branchId, offeringId }) => ({
        url: `/branches/${branchId}/academic-offerings/${offeringId}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    replaceOfferingSubjects: build.mutation<
      ApiRecord,
      { branchId: string; offeringId: string; subjectIds: string[] }
    >({
      query: ({ branchId, offeringId, subjectIds }) => ({
        url: `/branches/${branchId}/academic-offerings/${offeringId}/subjects`,
        method: 'PUT',
        body: { subjectIds },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
    replaceOfferingTeachers: build.mutation<
      ApiRecord,
      { branchId: string; offeringId: string; staffProfileIds: string[] }
    >({
      query: ({ branchId, offeringId, staffProfileIds }) => ({
        url: `/branches/${branchId}/academic-offerings/${offeringId}/teachers`,
        method: 'PUT',
        body: { staffProfileIds },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Academic'],
    }),
  }),
});
export const {
  useListSchoolClassesQuery,
  useCreateSchoolClassMutation,
  useUpdateSchoolClassMutation,
  useListAcademicGroupsQuery,
  useCreateAcademicGroupMutation,
  useUpdateAcademicGroupMutation,
  useReplaceAcademicGroupClassesMutation,
  useDeleteAcademicGroupMutation,
  useListCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useListOfferingsQuery,
  useCreateOfferingMutation,
  useUpdateOfferingMutation,
  useDeleteOfferingMutation,
  useReplaceOfferingSubjectsMutation,
  useReplaceOfferingTeachersMutation,
} = academicsApi;
