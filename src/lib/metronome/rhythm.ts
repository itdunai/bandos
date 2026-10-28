/** Сила доли: 3 — акцент, 2 — средняя, 1 — слабая, 0 — пауза. */
export type AccentLevel = 0 | 1 | 2 | 3;

/** Сколько кликов на долю: четверти, восьмые, триоли, шестнадцатые. */
export type Subdivision = 1 | 2 | 3 | 4;

export const BPM_MIN = 30;
export const BPM_MAX = 300;

export const SUBDIVISIONS: { value: Subdivision; label: string }[] = [
  { value: 1, label: "Четверти" },
  { value: 2, label: "Восьмые" },
  { value: 3, label: "Триоли" },
  { value: 4, label: "Шестнадцатые" },
];

export const ACCENT_LABELS: Record<AccentLevel, string> = {
  3: "акцент",
  2: "средняя",
  1: "слабая",
  0: "пауза",
};

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 120;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

export function getBeatsPerBar(timeSignature: string): number {
  const n = parseInt(timeSignature.split("/")[0] ?? "4", 10);
  return Number.isFinite(n) && n > 0 && n <= 32 ? n : 4;
}

/**
 * Группировка долей для размера: 6/8 = 3+3, 7/8 = 2+2+3, 5/4 = 3+2.
 * Первая доля такта — акцент, первые доли остальных групп — средние.
 */
export function beatGroups(timeSignature: string): number[] {
  const beats = getBeatsPerBar(timeSignature);
  const unit = parseInt(timeSignature.split("/")[1] ?? "4", 10);

  if (unit === 8 && beats > 3) {
    if (beats % 3 === 0) return Array(beats / 3).fill(3);
    const groups: number[] = [];
    let rest = beats;
    while (rest > 3) {
      groups.push(2);
      rest -= 2;
    }
    groups.push(rest);
    return groups;
  }
  if (beats === 4) return [2, 2];
  if (beats === 5) return [3, 2];
  if (beats === 6) return [3, 3];
  if (beats === 7) return [2, 2, 3];
  return [beats];
}

export function defaultAccents(timeSignature: string): AccentLevel[] {
  const levels: AccentLevel[] = [];
  for (const size of beatGroups(timeSignature)) {
    for (let i = 0; i < size; i++) {
      levels.push(i === 0 ? (levels.length === 0 ? 3 : 2) : 1);
    }
  }
  return levels;
}

/** Клик по доле: акцент → средняя → слабая → пауза → акцент. */
export function nextAccent(level: AccentLevel): AccentLevel {
  return level === 0 ? 3 : ((level - 1) as AccentLevel);
}

export function tempoName(bpm: number): string {
  if (bpm < 60) return "Largo";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  return "Presto";
}

/** Темп по последним касаниям (мс). Касания старше 2 с от предыдущего — новая серия. */
export function bpmFromTaps(times: number[]): number | null {
  if (times.length < 2) return null;
  const span = times[times.length - 1] - times[0];
  if (span <= 0) return null;
  return clampBpm(60000 / (span / (times.length - 1)));
}

export interface TrainerSettings {
  enabled: boolean;
  /** На сколько BPM прибавлять */
  step: number;
  /** Каждые N тактов */
  everyBars: number;
  /** Не выше */
  maxBpm: number;
}

export interface GapSettings {
  enabled: boolean;
  /** Тактов с кликом */
  playBars: number;
  /** Следом тактов тишины */
  muteBars: number;
}

/** Тихий ли такт (нумерация с 0, без такта отсчёта). */
export function isSilentBar(bar: number, gap: GapSettings): boolean {
  if (!gap.enabled || gap.muteBars <= 0) return false;
  const cycle = gap.playBars + gap.muteBars;
  return bar % cycle >= gap.playBars;
}

/** Темп после разгона в начале такта `bar` (нумерация с 0, без такта отсчёта). */
export function trainerBpm(bpm: number, bar: number, trainer: TrainerSettings): number {
  if (!trainer.enabled || bar === 0 || trainer.everyBars <= 0) return bpm;
  if (bar % trainer.everyBars !== 0 || bpm >= trainer.maxBpm) return bpm;
  return Math.min(trainer.maxBpm, clampBpm(bpm + trainer.step));
}
