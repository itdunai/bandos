export interface SetlistTextItem {
  title: string;
  isSection?: boolean;
  durationSec?: number;
}

/** «52 мин», «1 ч 05 мин» — для текста в мессенджер точность до минуты. */
export function formatMinutes(seconds: number): string {
  const total = Math.round(seconds / 60);
  if (total < 60) return `${total} мин`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} ч ${String(m).padStart(2, "0")} мин` : `${h} ч`;
}

function tracksWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "трек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "трека";
  return "треков";
}

/**
 * Сет-лист простым текстом — вставить в Telegram или ВК: название, итог,
 * блоки с нумерацией треков внутри каждого.
 */
export function setlistToText(name: string, items: SetlistTextItem[]): string {
  const tracks = items.filter((i) => !i.isSection);
  const totalSec = tracks.reduce((sum, i) => sum + (i.durationSec ?? 0), 0);

  const summary = [`${tracks.length} ${tracksWord(tracks.length)}`];
  if (totalSec > 0) summary.push(formatMinutes(totalSec));
  const lines = [`Сет-лист «${name.trim()}»`, summary.join(" · ")];

  let n = 0;
  items.forEach((item, index) => {
    if (item.isSection) {
      const block = [];
      for (let j = index + 1; j < items.length && !items[j].isSection; j++) block.push(items[j]);
      const sec = block.reduce((sum, i) => sum + (i.durationSec ?? 0), 0);
      lines.push("", sec > 0 ? `${item.title} (${formatMinutes(sec)})` : item.title);
      n = 0;
      return;
    }
    if (n === 0 && index === 0) lines.push("");
    n += 1;
    lines.push(`${n}. ${item.title}`);
  });

  return lines.join("\n");
}
