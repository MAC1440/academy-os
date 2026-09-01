import { baseApi, unwrap } from '@web/store/api/base-api';

export type WebsiteTemplate = 'CLASSIC' | 'MODERN' | 'MINIMAL';
export type WebsiteSettings = {
  schoolName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  template: WebsiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: WebsiteFont;
  bodyFont: WebsiteFont;
  contactEmail?: string;
  phone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  homepage: HomepageConfig;
  programs: WebsiteProgram[];
  facilities: WebsiteFacility[];
  faculty: WebsiteFaculty[];
};

export type HomepageConfig = {
  hero: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  introduction: { enabled: boolean; heading: string; content: string; imageUrl?: string };
  principalMessage: {
    enabled: boolean;
    name?: string;
    designation?: string;
    message?: string;
    imageUrl?: string;
  };
  programs: { enabled: boolean };
  facilities: { enabled: boolean };
  faculty: { enabled: boolean };
  contact: { enabled: boolean };
};
export type WebsiteProgram = {
  sourceId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  visible: boolean;
  sortOrder: number;
};
export type WebsiteFacility = {
  title: string;
  description?: string;
  imageUrl?: string;
  visible: boolean;
  sortOrder: number;
};
export type WebsiteFaculty = {
  sourceTeacherId?: string;
  name: string;
  designation: string;
  qualification?: string;
  subjects: string[];
  bio?: string;
  imageUrl?: string;
  visible: boolean;
  sortOrder: number;
};
export type ProgramImport = {
  sourceId: string;
  name: string;
  description?: string;
  sourceType: 'CLASS' | 'COURSE';
};
export type FacultyImport = {
  sourceTeacherId: string;
  name: string;
  designation: string;
  subjects: string[];
};
export type WebsiteFont =
  'Inter' | 'Poppins' | 'Montserrat' | 'Roboto' | 'Open Sans' | 'Lato' | 'Merriweather';
export type WebsiteRevision = {
  id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  data: WebsiteSettings;
  updatedAt: string;
  publishedAt?: string | null;
  publishedBy?: { id: string; fullName: string } | null;
};
export type WebsiteOverview = {
  status: 'PUBLISHED' | 'UNPUBLISHED';
  hasUnpublishedChanges: boolean;
  draft: WebsiteRevision;
  published?: WebsiteRevision | null;
  organization: { id: string; name: string };
};
export type PublicWebsite = {
  revisionId: string;
  data: WebsiteSettings;
  publishedAt: string;
};

export const websiteApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicWebsite: build.query<PublicWebsite | null, void>({
      query: () => '/public/website',
      transformResponse: unwrap,
      providesTags: ['Website'],
    }),
    getWebsiteOverview: build.query<WebsiteOverview, void>({
      query: () => '/website',
      transformResponse: unwrap,
      providesTags: ['Website'],
    }),
    getWebsitePreview: build.query<WebsiteRevision, void>({
      query: () => '/website/preview',
      transformResponse: unwrap,
      providesTags: ['Website'],
    }),
    getWebsiteProgramImports: build.query<ProgramImport[], void>({
      query: () => '/website/imports/programs',
      transformResponse: unwrap,
    }),
    getWebsiteFacultyImports: build.query<FacultyImport[], void>({
      query: () => '/website/imports/faculty',
      transformResponse: unwrap,
    }),
    saveWebsiteDraft: build.mutation<WebsiteRevision, WebsiteSettings>({
      query: (body) => ({ url: '/website/draft', method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
    publishWebsite: build.mutation<{ published: WebsiteRevision; draft: WebsiteRevision }, void>({
      query: () => ({ url: '/website/publish', method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
  }),
});

export const {
  useGetPublicWebsiteQuery,
  useGetWebsiteOverviewQuery,
  useGetWebsitePreviewQuery,
  useGetWebsiteProgramImportsQuery,
  useGetWebsiteFacultyImportsQuery,
  useSaveWebsiteDraftMutation,
  usePublishWebsiteMutation,
} = websiteApi;
