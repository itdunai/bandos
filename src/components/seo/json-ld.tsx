import { jsonLd } from "@/lib/seo";

/** Микроразметка schema.org для поисковиков. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // jsonLd() экранирует `<` — пользовательский текст не закроет тег.
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  );
}
