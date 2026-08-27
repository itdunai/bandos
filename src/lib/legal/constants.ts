export const PRIVACY_PAGE_SLUG = "privacy";
export const PRIVACY_PAGE_PATH = "/privacy";
export const PRIVACY_PAGE_TAG = "site-page:privacy";

export const SITE_PAGE_TITLE_MAX = 200;
export const SITE_PAGE_BODY_MAX = 200_000;

export type SitePage = {
  slug: string;
  title: string;
  body: string;
  updated_at: string | null;
  source: "database" | "default";
};
