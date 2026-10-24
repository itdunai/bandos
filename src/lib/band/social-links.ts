import { sanitizeExternalUrl } from "@/lib/safe-url";
import {
  SOCIAL_LABELS,
  type CustomSocialLink,
  type SocialLinks,
  type SocialPlatform,
} from "@/types/database";

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_LABELS) as SocialPlatform[];

export const CUSTOM_LINKS_MAX = 20;
export const CUSTOM_LINK_LABEL_MAX = 40;

export interface SocialLinkItem {
  id: string;
  label: string;
  url: string;
}

function normalizeCustomLinks(raw: unknown): CustomSocialLink[] {
  if (!Array.isArray(raw)) return [];
  const result: CustomSocialLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as CustomSocialLink).label ?? "")
      .trim()
      .slice(0, CUSTOM_LINK_LABEL_MAX);
    const url = sanitizeExternalUrl(String((item as CustomSocialLink).url ?? ""));
    if (!label || !url) continue;
    result.push({ label, url });
    if (result.length >= CUSTOM_LINKS_MAX) break;
  }
  return result;
}

/** Свои ссылки из `social_links` (данные из БД — не доверяем форме). */
export function getCustomLinks(links: SocialLinks | null | undefined): CustomSocialLink[] {
  return normalizeCustomLinks(links?.custom);
}

/** Все ссылки группы для отображения: сначала фиксированные соцсети, затем свои. */
export function getSocialLinkList(
  links: SocialLinks | null | undefined
): SocialLinkItem[] {
  const items: SocialLinkItem[] = [];
  for (const key of SOCIAL_PLATFORMS) {
    const raw = links?.[key];
    const url = typeof raw === "string" ? sanitizeExternalUrl(raw) : null;
    if (url) items.push({ id: key, label: SOCIAL_LABELS[key], url });
  }
  getCustomLinks(links).forEach((link, i) => {
    items.push({ id: `custom-${i}`, label: link.label, url: link.url });
  });
  return items;
}

/** Поля формы: `social_<platform>` и `social_custom_json` (массив `{label, url}`). */
export function parseSocialLinksForm(formData: FormData): SocialLinks {
  const links: SocialLinks = {};
  for (const key of SOCIAL_PLATFORMS) {
    const safe = sanitizeExternalUrl(formData.get(`social_${key}`) as string | null);
    if (safe) links[key] = safe;
  }

  const rawCustom = formData.get("social_custom_json");
  if (typeof rawCustom === "string" && rawCustom.trim()) {
    try {
      const custom = normalizeCustomLinks(JSON.parse(rawCustom));
      if (custom.length > 0) links.custom = custom;
    } catch {
      // некорректный JSON — свои ссылки не сохраняем
    }
  }
  return links;
}
