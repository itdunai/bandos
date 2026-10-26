import { getSiteUrl } from "@/lib/site-url";

export const SITE_NAME = "BandOS";

export const SITE_TITLE = "BandOS — приложение для музыкальной группы";

export const SITE_DESCRIPTION =
  "Бесплатный сервис для кавер- и авторских групп: репертуар с аккордами и текстами, сет-листы, режим «Играем» на сцене, график репетиций и концертов, финансы и публичная страница с техрайдером для заказчиков.";

export const SITE_KEYWORDS = [
  "приложение для музыкальной группы",
  "сет-лист",
  "репертуар группы",
  "техрайдер",
  "кавер-группа",
  "график репетиций",
  "аккорды и тексты песен",
  "заказать группу на мероприятие",
];

/** Картинка для соцсетей и мессенджеров по умолчанию (public/og-image.png). */
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "BandOS — всё для музыкальной группы",
};

export function siteOrigin(): string {
  return getSiteUrl().replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Обрезка по слову для meta description (~155 символов). */
export function truncateText(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:—–-]+$/, "")}…`;
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export interface BandSeoInput {
  name: string;
  genre: string | null;
  city: string | null;
  description: string | null;
  tracks_count: number;
  repertoire_public: boolean;
  rider_public: boolean;
  accept_bookings?: boolean;
}

/** Уникальный title публичной страницы группы. */
export function bandPageTitle(band: BandSeoInput): string {
  const details = [band.genre, band.city].filter(Boolean).join(", ");
  return details ? `${band.name} — ${details}` : `${band.name} — музыкальная группа`;
}

/** Уникальный description: описание группы или шаблон из её данных. */
export function bandPageDescription(band: BandSeoInput): string {
  const parts: string[] = [];
  const who = [
    "Группа",
    `«${band.name}»`,
    band.genre ? `(${band.genre}${band.city ? `, ${band.city}` : ""})` : band.city ? `(${band.city})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  parts.push(who + ".");
  if (band.description) parts.push(band.description);
  const offers: string[] = [];
  if (band.repertoire_public && band.tracks_count > 0) {
    offers.push(`репертуар — ${band.tracks_count} ${plural(band.tracks_count, "трек", "трека", "треков")}`);
  }
  if (band.rider_public) offers.push("техрайдер");
  offers.push("контакты");
  if (band.accept_bookings) offers.push("заявка на выступление");
  parts.push(`На странице: ${offers.join(", ")}.`);
  return truncateText(parts.join(" "));
}

/**
 * JSON для <script type="application/ld+json">. Экранируем `<`, чтобы
 * пользовательский текст (название, описание) не мог закрыть тег script.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
