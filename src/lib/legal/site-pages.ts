import {
  DEFAULT_PRIVACY_BODY,
  DEFAULT_PRIVACY_TITLE,
} from "@/lib/legal/privacy-default";
import {
  PRIVACY_PAGE_SLUG,
  PRIVACY_PAGE_TAG,
  type SitePage,
} from "@/lib/legal/constants";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { SitePage } from "@/lib/legal/constants";
export {
  PRIVACY_PAGE_SLUG,
  PRIVACY_PAGE_PATH,
  PRIVACY_PAGE_TAG,
  SITE_PAGE_TITLE_MAX,
  SITE_PAGE_BODY_MAX,
} from "@/lib/legal/constants";

export function defaultPrivacyPage(): SitePage {
  return {
    slug: PRIVACY_PAGE_SLUG,
    title: DEFAULT_PRIVACY_TITLE,
    body: DEFAULT_PRIVACY_BODY,
    updated_at: null,
    source: "default",
  };
}

function normalizePage(row: {
  slug?: string | null;
  title?: string | null;
  body?: string | null;
  updated_at?: string | null;
}): SitePage | null {
  const title = row.title?.trim() ?? "";
  const body = row.body?.trim() ?? "";
  if (!title || !body) return null;
  return {
    slug: row.slug?.trim() || PRIVACY_PAGE_SLUG,
    title,
    body,
    updated_at: row.updated_at ?? null,
    source: "database",
  };
}

export async function fetchSitePage(
  slug: string,
  client?: SupabaseClient | null
): Promise<SitePage | null> {
  const supabase = client ?? createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_pages")
    .select("slug, title, body, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePage(data);
}

async function fetchPrivacyPage(): Promise<SitePage> {
  const page = await fetchSitePage(PRIVACY_PAGE_SLUG);
  return page ?? defaultPrivacyPage();
}

export const getCachedPrivacyPage = unstable_cache(
  fetchPrivacyPage,
  ["site-page-privacy"],
  {
    revalidate: 60,
    tags: [PRIVACY_PAGE_TAG],
  }
);

export async function getPrivacyPageUncached(
  client?: SupabaseClient | null
): Promise<SitePage> {
  const page = await fetchSitePage(PRIVACY_PAGE_SLUG, client);
  return page ?? defaultPrivacyPage();
}
