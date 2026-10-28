import { playMetronomeBeat, type MetronomeSound } from "@/lib/metronome-sounds";
import {
  isSilentBar,
  trainerBpm,
  type AccentLevel,
  type GapSettings,
  type Subdivision,
  type TrainerSettings,
} from "@/lib/metronome/rhythm";

export interface MetronomeEngineConfig {
  levels: AccentLevel[];
  subdivision: Subdivision;
  sound: MetronomeSound;
  /** 0…1 */
  volume: number;
  countIn: boolean;
  trainer: TrainerSettings;
  gap: GapSettings;
}

export type MetronomePhase = "idle" | "count" | "play" | "silent";

export interface MetronomePulse {
  beat: number;
  subdivision: number;
  /** Номер такта с 1; 0 — такт отсчёта */
  bar: number;
  phase: MetronomePhase;
}

export const IDLE_PULSE: MetronomePulse = { beat: -1, subdivision: -1, bar: 0, phase: "idle" };

const SCHEDULE_AHEAD_SEC = 0.12;
/** Фоновая вкладка будит таймеры раз в ~1 с — планируем с запасом, чтобы не было дыр. */
const HIDDEN_AHEAD_SEC = 1.5;
const TICK_MS = 25;

/**
 * Планировщик кликов на Web Audio (lookahead): звук ставится в очередь
 * AudioContext заранее, поэтому не плывёт от нагрузки на главный поток.
 */
export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private interval: number | null = null;
  private visuals: number[] = [];
  private nextTime = 0;
  private beat = 0;
  private sub = 0;
  /** Такт с 0; -1 — отсчёт */
  private bar = 0;
  private bpm = 120;

  constructor(
    private readonly getConfig: () => MetronomeEngineConfig,
    private readonly onPulse: (pulse: MetronomePulse, trainerBpm: number | null) => void
  ) {}

  get running() {
    return this.interval !== null;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  start(bpm: number) {
    this.stop();
    const ctx = this.audio();
    this.bpm = bpm;
    this.nextTime = ctx.currentTime + 0.06;
    this.beat = 0;
    this.sub = 0;
    this.bar = this.getConfig().countIn ? -1 : 0;
    this.interval = window.setInterval(() => this.run(), TICK_MS);
    this.run();
  }

  stop() {
    if (this.interval !== null) window.clearInterval(this.interval);
    this.interval = null;
    for (const id of this.visuals) window.clearTimeout(id);
    this.visuals = [];
  }

  /** Одиночный клик — для тапа и прослушивания тембра. */
  click(level: AccentLevel = 3, sound?: MetronomeSound) {
    const ctx = this.audio();
    const config = this.getConfig();
    playMetronomeBeat(ctx, sound ?? config.sound, { level, volume: config.volume }, ctx.currentTime + 0.005);
  }

  dispose() {
    this.stop();
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }

  private audio() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private run() {
    const ctx = this.ctx;
    if (!ctx || this.interval === null) return;
    const ahead = document.hidden ? HIDDEN_AHEAD_SEC : SCHEDULE_AHEAD_SEC;

    while (this.nextTime < ctx.currentTime + ahead) {
      const cfg = this.getConfig();
      const beats = cfg.levels.length || 1;
      if (this.beat >= beats) {
        this.beat = 0;
        this.sub = 0;
        this.bar += 1;
      }

      const counting = this.bar < 0;
      const subdivisions = counting ? 1 : cfg.subdivision;
      if (this.sub >= subdivisions) this.sub = 0;

      let bumped: number | null = null;
      if (!counting && this.beat === 0 && this.sub === 0 && this.bar > 0) {
        const next = trainerBpm(this.bpm, this.bar, cfg.trainer);
        if (next !== this.bpm) {
          this.bpm = next;
          bumped = next;
        }
      }

      const silent = !counting && isSilentBar(this.bar, cfg.gap);
      const level: AccentLevel = counting ? (this.beat === 0 ? 3 : 1) : (cfg.levels[this.beat] ?? 1);
      if (!silent && level > 0) {
        playMetronomeBeat(
          ctx,
          cfg.sound,
          { level, subdivision: this.sub > 0, volume: cfg.volume },
          this.nextTime
        );
      }

      this.queueVisual(this.nextTime, {
        beat: this.beat,
        subdivision: this.sub,
        bar: this.bar + 1,
        phase: counting ? "count" : silent ? "silent" : "play",
      }, bumped);

      this.nextTime += 60 / this.bpm / subdivisions;
      this.sub += 1;
      if (this.sub >= subdivisions) {
        this.sub = 0;
        this.beat += 1;
      }
    }
  }

  private queueVisual(when: number, pulse: MetronomePulse, bumped: number | null) {
    const ctx = this.ctx!;
    const id = window.setTimeout(() => {
      this.visuals = this.visuals.filter((v) => v !== id);
      if (this.interval !== null) this.onPulse(pulse, bumped);
    }, Math.max(0, (when - ctx.currentTime) * 1000));
    this.visuals.push(id);
  }
}
