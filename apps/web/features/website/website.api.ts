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
export type ScheduledContent = {
  id: string;
  title: string;
  published: boolean;
  publishAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type WebsiteAnnouncement = ScheduledContent & {
  description: string;
  pinned: boolean;
  expireAt?: string | null;
};
export type WebsiteNews = ScheduledContent & {
  slug: string;
  coverImageUrl?: string;
  excerpt: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
};
export type WebsiteResult = ScheduledContent & {
  description: string;
  academicYear: string;
  highlights: string[];
  imageUrl?: string;
};
export type WebsiteMedia = {
  id: string;
  providerFileId: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  mimeType: string;
  size: number;
  category: string;
  createdAt: string;
};
export type WebsiteEvent = {
  id: string;
  calendarDate: string;
  dayType: 'HOLIDAY' | 'OFF_DAY';
  label?: string;
  description?: string;
  visibility: 'INTERNAL' | 'PUBLIC';
};
export type WebsiteAlbum = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  academicCalendarDayId?: string;
  published: boolean;
  sortOrder: number;
  images: Array<{
    id: string;
    mediaId: string;
    caption?: string;
    sortOrder: number;
    media: WebsiteMedia;
  }>;
};
export type WebsiteContentBundle = {
  announcements: WebsiteAnnouncement[];
  news: WebsiteNews[];
  results: WebsiteResult[];
  albums: WebsiteAlbum[];
  media: WebsiteMedia[];
  events: WebsiteEvent[];
};
export type PublicContentBundle = WebsiteContentBundle;

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
    getWebsiteContent: build.query<WebsiteContentBundle, void>({
      query: () => '/website/content',
      transformResponse: unwrap,
      providesTags: ['Website'],
    }),
    getPublicWebsiteContent: build.query<PublicContentBundle, void>({
      query: () => '/public/website/content',
      transformResponse: unwrap,
      providesTags: ['Website'],
    }),
    getPublicNewsArticle: build.query<WebsiteNews, string>({
      query: (slug) => `/public/website/news/${slug}`,
      transformResponse: unwrap,
    }),
    getPublicGalleryAlbum: build.query<WebsiteAlbum, string>({
      query: (slug) => `/public/website/gallery/${slug}`,
      transformResponse: unwrap,
    }),
    saveWebsiteContent: build.mutation<
      unknown,
      { kind: 'announcements' | 'news' | 'results' | 'albums'; id?: string; body: unknown }
    >({
      query: ({ kind, id, body }) => ({
        url: `/website/${kind}${id ? `/${id}` : ''}`,
        method: id ? 'PATCH' : 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
    deleteWebsiteContent: build.mutation<
      unknown,
      { kind: 'announcements' | 'news' | 'results' | 'albums'; id: string }
    >({
      query: ({ kind, id }) => ({ url: `/website/${kind}/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
    uploadWebsiteMedia: build.mutation<WebsiteMedia, FormData>({
      query: (body) => ({ url: '/website/media/upload', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
    addWebsiteAlbumImage: build.mutation<
      unknown,
      { albumId: string; mediaId: string; caption?: string; sortOrder: number }
    >({
      query: ({ albumId, ...body }) => ({
        url: `/website/albums/${albumId}/images`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
    }),
    removeWebsiteAlbumImage: build.mutation<unknown, { albumId: string; mediaId: string }>({
      query: ({ albumId, mediaId }) => ({
        url: `/website/albums/${albumId}/images/${mediaId}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Website'],
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
  useGetWebsiteContentQuery,
  useGetPublicWebsiteContentQuery,
  useGetPublicNewsArticleQuery,
  useGetPublicGalleryAlbumQuery,
  useSaveWebsiteContentMutation,
  useDeleteWebsiteContentMutation,
  useUploadWebsiteMediaMutation,
  useAddWebsiteAlbumImageMutation,
  useRemoveWebsiteAlbumImageMutation,
} = websiteApi;
