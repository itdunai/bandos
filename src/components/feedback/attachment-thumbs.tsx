/** Скриншоты обращения: миниатюры, по клику — оригинал в новой вкладке. */
export function AttachmentThumbs({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border transition-colors hover:border-accent"
            aria-label={`Вложение ${i + 1} — открыть`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- временная ссылка Storage */}
            <img src={url} alt={`Вложение ${i + 1}`} loading="lazy" className="h-20 w-20 object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}
