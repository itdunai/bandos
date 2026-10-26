const SONGS = [
  "Полночь",
  "Группа крови",
  "Кукушка",
  "Night Drive",
  "Звезда по имени Солнце",
  "Ветер перемен",
  "Северный ветер",
  "Smells Like Teen Spirit",
];

/** Бегущая строка из названий песен — декоративная. */
export function HomeMarquee() {
  const items = [...SONGS, ...SONGS];
  return (
    <div aria-hidden className="overflow-hidden whitespace-nowrap border-y border-border bg-bg-2 py-4">
      <div className="marquee-track inline-flex">
        {items.map((song, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className={`heading-poster text-2xl sm:text-[34px] ${
                i % 2 === 0 ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {song}
            </span>
            <span className="mx-8 text-2xl text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
