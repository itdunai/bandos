export type MetronomeSound = "classic" | "click" | "wood" | "digital";

export const METRONOME_SOUND_LABELS: Record<MetronomeSound, string> = {
  classic: "Классика",
  click: "Щелчок",
  wood: "Дерево",
  digital: "Цифра",
};

export const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"] as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];

export function getBeatsPerBar(timeSignature: string): number {
  const n = parseInt(timeSignature.split("/")[0] ?? "4", 10);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function playMetronomeBeat(
  ctx: AudioContext,
  sound: MetronomeSound,
  isDownbeat: boolean,
  when?: number
) {
  const t = when ?? ctx.currentTime;
  const peak = isDownbeat ? 1 : 0.85;

  switch (sound) {
    case "classic": {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = isDownbeat ? 1400 : 1000;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(peak, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    }
    case "click": {
      const bufferSize = Math.floor(ctx.sampleRate * 0.03);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1200;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(peak, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      source.start(t);
      source.stop(t + 0.04);
      break;
    }
    case "wood": {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = isDownbeat ? 520 : 420;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(peak * 0.95, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.start(t);
      osc.stop(t + 0.06);
      break;
    }
    case "digital": {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = isDownbeat ? 1800 : 1200;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(peak * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
      break;
    }
  }
}
