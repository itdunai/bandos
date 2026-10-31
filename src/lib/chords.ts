/**
 * Аккорды в тексте: распознавание и транспонирование.
 *
 * Строка аккордов — в ней только аккорды и служебные знаки («|», «x2», «-»,
 * «Intro:» в начале). Остальные строки — слова; аккорды в них можно писать
 * в квадратных скобках: «[Am]Пепел [F]любви».
 *
 * Русская нотация: если в тексте встречается H, то H = си, B = си-бемоль.
 */

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const LETTER_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 };

const SUFFIX = "(?:maj|min|dim|aug|sus|add|m|M|°|ø|\\+|-|\\d|\\(|\\)|b|#|♭|♯)*";
const CHORD_RE = new RegExp(`^([A-H])([#b♯♭]?)(${SUFFIX})(?:\\/([A-H])([#b♯♭]?))?$`);
/** Служебные знаки в строке аккордов */
const FILLER_RE = /^(?:\|+|:?\|\|?:?|[-–—.~%/]+|[xх×]\d+|\(?[xх×]\d+\)?|N\.?C\.?|\*+)$/i;
/** Метка в начале строки: «Intro:», «Припев:», «[Куплет]» */
const LABEL_RE = /^(?:\[[^\]]+\]|\S+:)$/;
const INLINE_RE = /\[([^\]\s]{1,12})\]/g;

export interface ChordNotation {
  /** H = си, B = си-бемоль (русская/немецкая запись) */
  useH: boolean;
  preferFlats: boolean;
}

export function isChord(token: string): boolean {
  return CHORD_RE.test(token);
}

function tokensOf(line: string) {
  const out: { text: string; start: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push({ text: m[0], start: m.index });
  return out;
}

/** Строка состоит из аккордов (и служебных знаков), а не из слов. */
export function isChordLine(line: string): boolean {
  const tokens = tokensOf(line);
  let chords = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].text;
    if (isChord(t)) chords++;
    else if (FILLER_RE.test(t)) continue;
    else if (i === 0 && LABEL_RE.test(t) && tokens.length > 1) continue;
    else return false;
  }
  return chords > 0;
}

/** Как записаны аккорды в тексте — чтобы транспонированные выглядели так же. */
export function detectNotation(body: string): ChordNotation {
  let sharps = 0;
  let flats = 0;
  let useH = false;
  const visit = (chord: string) => {
    const m = CHORD_RE.exec(chord);
    if (!m) return;
    if (m[1] === "H") useH = true;
    if (m[2] === "#" || m[2] === "♯") sharps++;
    if (m[2] === "b" || m[2] === "♭") flats++;
  };
  for (const line of body.split("\n")) {
    if (isChordLine(line)) tokensOf(line).forEach((t) => visit(t.text));
    for (const m of line.matchAll(INLINE_RE)) visit(m[1]);
  }
  return { useH, preferFlats: flats > sharps };
}

function noteIndex(letter: string, accidental: string, notation: ChordNotation): number {
  // В русской записи B — это си-бемоль
  let index = notation.useH && letter === "B" ? 10 : LETTER_INDEX[letter];
  if (accidental === "#" || accidental === "♯") index += 1;
  if (accidental === "b" || accidental === "♭") index -= 1;
  return (index + 12) % 12;
}

function noteName(index: number, notation: ChordNotation): string {
  const name = (notation.preferFlats ? FLATS : SHARPS)[index];
  if (!notation.useH) return name;
  if (name === "B") return "H";
  if (name === "Bb" || name === "A#") return "B";
  return name;
}

export function transposeChord(chord: string, semitones: number, notation: ChordNotation): string {
  const m = CHORD_RE.exec(chord);
  if (!m || semitones % 12 === 0) return chord;
  const shift = (letter: string, acc: string) =>
    noteName((noteIndex(letter, acc, notation) + semitones + 120) % 12, notation);
  const root = shift(m[1], m[2]);
  const bass = m[4] ? `/${shift(m[4], m[5] ?? "")}` : "";
  return `${root}${m[3]}${bass}`;
}

/** Тональность трека («Em», «F#m», «Hm») — тем же способом, что и аккорды. */
export function transposeKey(key: string | null, semitones: number, notation: ChordNotation) {
  if (!key) return key;
  const trimmed = key.trim();
  return isChord(trimmed) ? transposeChord(trimmed, semitones, notation) : key;
}

export type ChordSegment = { text: string; chord?: boolean };
export type ChordSheetLine = { kind: "chords" | "lyrics"; segments: ChordSegment[] };

/**
 * Разбор текста с аккордами для показа. В строке аккордов каждый аккорд
 * остаётся на своей позиции (над нужным словом), даже если после
 * транспонирования стал длиннее: «E» → «F#».
 */
export function parseChordSheet(
  body: string,
  semitones = 0,
  notation: ChordNotation = detectNotation(body)
): ChordSheetLine[] {
  return body.split("\n").map((line) => {
    if (isChordLine(line)) {
      const segments: ChordSegment[] = [];
      let col = 0;
      for (const token of tokensOf(line)) {
        const chord = isChord(token.text);
        const text = chord ? transposeChord(token.text, semitones, notation) : token.text;
        // Хотя бы один пробел между соседями, если предыдущий аккорд «вырос»
        const gap = Math.max(token.start - col, col === 0 ? token.start : 1);
        if (gap > 0) segments.push({ text: " ".repeat(gap) });
        segments.push({ text, chord });
        col = col + gap + text.length;
      }
      return { kind: "chords", segments };
    }

    const segments: ChordSegment[] = [];
    let last = 0;
    for (const m of line.matchAll(INLINE_RE)) {
      if (!isChord(m[1])) continue;
      if (m.index > last) segments.push({ text: line.slice(last, m.index) });
      segments.push({ text: `[${transposeChord(m[1], semitones, notation)}]`, chord: true });
      last = m.index + m[0].length;
    }
    if (last < line.length || segments.length === 0) segments.push({ text: line.slice(last) });
    return { kind: "lyrics", segments };
  });
}

/** «+2», «−1», «0» — для подписи сдвига. */
export function formatSemitones(n: number): string {
  if (n === 0) return "0";
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}
