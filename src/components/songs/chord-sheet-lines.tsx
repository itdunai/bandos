import type { ChordSheetLine } from "@/lib/chords";

/**
 * Строки текста с аккордами (из parseChordSheet): слова обычным цветом,
 * аккорды — акцентом. Вставляется внутрь <pre>, переносы строк сохраняются.
 */
export function ChordSheetLines({ lines }: { lines: ChordSheetLine[] }) {
  return lines.map((line, i) => (
    <span key={i}>
      {line.segments.map((seg, j) =>
        seg.chord ? (
          <span key={j} className="font-semibold text-accent">
            {seg.text}
          </span>
        ) : (
          seg.text
        )
      )}
      {i < lines.length - 1 && "\n"}
    </span>
  ));
}
