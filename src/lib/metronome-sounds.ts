import type { AccentLevel } from "@/lib/metronome/rhythm";

export type MetronomeSound = "classic" | "click" | "wood" | "digital";

export const METRONOME_SOUND_LABELS: Record<MetronomeSound, string> = {
  classic: "Классика",
  wood: "Дерево",
  click: "Щелчок",
  digital: "Цифра",
};

export function isMetronomeSound(value: unknown): value is MetronomeSound {
  return typeof value === "string" && value in METRONOME_SOUND_LABELS;
}

const LEVEL_GAIN: Record<AccentLevel, number> = { 3: 1, 2: 0.75, 1: 0.55, 0: 0 };
const SUBDIVISION_GAIN = 0.28;

/**
 * Один клик. `level` — сила доли; `subdivision` — тихий клик деления внутри доли.
 * `volume` 0…1.
 */
export function playMetronomeBeat(
  ctx: AudioContext,
  sound: MetronomeSound,
  options: { level: AccentLevel; subdivision?: boolean; volume?: number },
  when?: number
) {
  const t = when ?? ctx.currentTime;
  const { level, subdivision = false, volume = 1 } = options;
  const peak = volume * (subdivision ? SUBDIVISION_GAIN : LEVEL_GAIN[level]);
  if (peak <= 0) return;

  const strong = level === 3 && !subdivision;
  const pitch = (base: number) => (strong ? base * 1.4 : subdivision ? base * 0.8 : base);

  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (sound === "click") {
    const length = 0.04;
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = pitch(1200);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    source.start(t);
    source.stop(t + length);
    return;
  }

  const voice = {
    classic: { type: "sine", base: 1000, length: 0.1, gain: 1 },
    wood: { type: "triangle", base: 420, length: 0.06, gain: 0.95 },
    digital: { type: "square", base: 1200, length: 0.05, gain: 0.5 },
  }[sound] as { type: OscillatorType; base: number; length: number; gain: number };

  const osc = ctx.createOscillator();
  osc.type = voice.type;
  osc.frequency.value = pitch(voice.base);
  osc.connect(gain);
  gain.gain.setValueAtTime(peak * voice.gain, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + voice.length);
  osc.start(t);
  osc.stop(t + voice.length);
}
