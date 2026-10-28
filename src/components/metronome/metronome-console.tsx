"use client";

import { BeatCells } from "@/components/metronome/beat-cells";
import { useMetronome } from "@/components/metronome/use-metronome";
import { useMetronomeSettings } from "@/components/metronome/use-metronome-settings";
import { METRONOME_SOUND_LABELS, type MetronomeSound } from "@/lib/metronome-sounds";
import {
  BPM_MAX,
  BPM_MIN,
  bpmFromTaps,
  clampBpm,
  defaultAccents,
  nextAccent,
  SUBDIVISIONS,
  tempoName,
  type AccentLevel,
} from "@/lib/metronome/rhythm";
import { useWakeLock } from "@/lib/use-wake-lock";
import { cn } from "@/lib/utils";
import { TIME_SIGNATURES } from "@/types/database";
import { Play, Square, Sun, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export interface MetronomeTrack {
  id: string;
  title: string;
  songKey: string | null;
  bpm: number;
  timeSignature: string;
}

export interface MetronomeSetlist {
  id: string;
  name: string;
  items: { title: string; trackId: string | null }[];
}

const SCALE = [30, 60, 90, 120, 150, 180, 240, 300];
const SOUND_ORDER: MetronomeSound[] = ["classic", "wood", "click", "digital"];

export function MetronomeConsole({
  tracks,
  setlists,
  songsHref,
  initialTrackId,
}: {
  tracks: MetronomeTrack[];
  setlists: MetronomeSetlist[];
  songsHref: string;
  initialTrackId?: string | null;
}) {
  const initialTrack = tracks.find((t) => t.id === initialTrackId) ?? null;
  const [settings, updateSettings] = useMetronomeSettings();

  const [bpm, setBpmState] = useState(initialTrack?.bpm ?? 120);
  const [timeSignature, setTimeSignatureState] = useState(initialTrack?.timeSignature ?? "4/4");
  const [levels, setLevels] = useState<AccentLevel[]>(() =>
    defaultAccents(initialTrack?.timeSignature ?? "4/4")
  );
  const [trackId, setTrackId] = useState<string | null>(initialTrack?.id ?? null);
  const [source, setSource] = useState<"tracks" | "setlist">("tracks");
  const [setlistId, setSetlistId] = useState(setlists[0]?.id ?? null);
  const [setIdx, setSetIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [tapLit, setTapLit] = useState(false);
  const tapsRef = useRef<number[]>([]);

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);
  const track = trackId ? trackById.get(trackId) ?? null : null;
  const setlist = setlists.find((s) => s.id === setlistId) ?? null;

  const { playing, pulse, start, stop, click } = useMetronome({
    bpm,
    config: {
      levels,
      subdivision: settings.subdivision,
      sound: settings.sound,
      volume: settings.volume / 100,
      countIn: settings.countIn,
      trainer: settings.trainer,
      gap: settings.gap,
    },
    onTrainerBpm: setBpmState,
  });
  const screenAwake = useWakeLock(playing);

  function setBpm(value: number) {
    setBpmState(clampBpm(value));
    setTrackId(null);
  }

  function setTimeSignature(ts: string) {
    setTimeSignatureState(ts);
    setLevels(defaultAccents(ts));
  }

  function loadTrack(t: MetronomeTrack) {
    setBpmState(t.bpm);
    setTimeSignatureState(t.timeSignature);
    setLevels(defaultAccents(t.timeSignature));
    setTrackId(t.id);
  }

  function findPlayable(list: MetronomeSetlist | null, from: number, dir: 1 | -1) {
    if (!list) return -1;
    for (let i = from; i >= 0 && i < list.items.length; i += dir) {
      const id = list.items[i].trackId;
      if (id && trackById.has(id)) return i;
    }
    return -1;
  }

  function loadSetlistItem(list: MetronomeSetlist | null, index: number) {
    const id = list?.items[index]?.trackId;
    const t = id ? trackById.get(id) : undefined;
    if (!t) return;
    setSetIdx(index);
    loadTrack(t);
  }

  function chooseSetlist(id: string) {
    const list = setlists.find((s) => s.id === id) ?? null;
    setSetlistId(id);
    loadSetlistItem(list, findPlayable(list, 0, 1));
  }

  function toggle() {
    if (!playing) {
      start();
      return;
    }
    stop();
    // Сет-лист: после стопа готов следующий трек
    if (source === "setlist") {
      const next = findPlayable(setlist, setIdx + 1, 1);
      if (next !== -1) loadSetlistItem(setlist, next);
    }
  }

  function tap() {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (!playing) click(taps.length === 1 ? 3 : 1);
    const next = bpmFromTaps(taps);
    if (next) setBpm(next);
    setTapLit(true);
    window.setTimeout(() => setTapLit(false), 110);
  }

  // Горячие клавиши: пробел, стрелки (с Shift — по 5), T
  const keysRef = useRef({ toggle, tap, setBpm, bpm });
  useEffect(() => {
    keysRef.current = { toggle, tap, setBpm, bpm };
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      const k = keysRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) k.toggle();
      } else if (e.code === "ArrowRight" || e.code === "ArrowUp") {
        e.preventDefault();
        k.setBpm(k.bpm + (e.shiftKey ? 5 : 1));
      } else if (e.code === "ArrowLeft" || e.code === "ArrowDown") {
        e.preventDefault();
        k.setBpm(k.bpm - (e.shiftKey ? 5 : 1));
      } else if (e.code === "KeyT" && !e.repeat) {
        k.tap();
      }
    }
    // Пробел на кнопке в фокусе иначе «нажмёт» и её
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space" && (e.target as HTMLElement | null)?.closest("button")) {
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onBeat = playing && pulse.phase !== "silent" && pulse.subdivision === 0 && pulse.beat >= 0;
  const downbeat = onBeat && pulse.beat === 0;

  const barLabel = !playing
    ? "стоп"
    : pulse.phase === "count"
      ? "отсчёт"
      : pulse.phase === "silent"
        ? `${pulse.bar} · тихий, держите темп`
        : String(Math.max(1, pulse.bar));

  const timeSignatures: string[] = TIME_SIGNATURES.includes(
    timeSignature as (typeof TIME_SIGNATURES)[number]
  )
    ? [...TIME_SIGNATURES]
    : [...TIME_SIGNATURES, timeSignature];

  const filteredTracks = query.trim()
    ? tracks.filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    : tracks;

  return (
    <div className="flex flex-wrap items-start gap-5">
      {/* Пульт */}
      <section
        aria-label="Пульт метронома"
        className={cn(
          "flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-xl border p-4 transition-colors duration-75 sm:gap-6 sm:p-6",
          settings.flash && onBeat
            ? downbeat
              ? "border-accent bg-accent/20"
              : "border-accent bg-accent/10"
            : "border-border bg-bg-2"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm">
            <span className="shrink-0 text-text-muted">Темп:</span>
            <span className="truncate font-semibold">
              {track
                ? `${track.title} · ${[track.songKey, track.timeSignature].filter(Boolean).join(" · ")}`
                : "свободный"}
            </span>
            {track && (
              <button
                type="button"
                onClick={() => setTrackId(null)}
                aria-label="Свободный темп"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-bg-3 hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Такт · {barLabel}
          </span>
        </div>

        {/* Темп */}
        <div className="grid grid-cols-4 items-center gap-1.5 sm:flex sm:justify-between sm:gap-4">
          <div className="col-span-4 flex flex-col items-center gap-2 sm:order-2 sm:flex-1">
            <span
              className={cn(
                "font-display text-[96px] font-bold leading-[0.9] tracking-[-0.04em] tabular-nums transition-colors duration-75 sm:text-[136px] xl:text-[152px]",
                downbeat ? "text-accent" : "text-text-primary"
              )}
            >
              {bpm}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              BPM · {tempoName(bpm)}
            </span>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-1.5 sm:order-1 sm:flex">
            <StepButton label="−5" aria="Медленнее на 5" onClick={() => setBpm(bpm - 5)} />
            <StepButton label="−1" aria="Медленнее на 1" onClick={() => setBpm(bpm - 1)} />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-1.5 sm:order-3 sm:flex">
            <StepButton label="+1" aria="Быстрее на 1" onClick={() => setBpm(bpm + 1)} />
            <StepButton label="+5" aria="Быстрее на 5" onClick={() => setBpm(bpm + 5)} />
          </div>
        </div>

        <div>
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            aria-label="Темп"
            className="w-full accent-accent"
          />
          <div className="mt-1 hidden justify-between text-xs tabular-nums text-text-muted sm:flex">
            {SCALE.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBpm(v)}
                className="hover:text-text-primary"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Доли */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs text-text-muted">
            Клик по доле: акцент → средняя → слабая → пауза
          </span>
          <BeatCells
            levels={levels}
            pulse={pulse}
            subdivision={settings.subdivision}
            onCycle={(i) =>
              setLevels((prev) => prev.map((l, j) => (j === i ? nextAccent(l) : l)))
            }
          />
        </div>

        <div className="flex gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex h-[72px] flex-1 items-center justify-center gap-3 rounded-lg font-display text-base font-bold uppercase transition-colors sm:text-lg",
              playing
                ? "bg-accent-dark text-white"
                : "bg-accent text-accent-ink hover:bg-accent-dark hover:text-white"
            )}
          >
            {playing ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {playing ? "Стоп" : settings.countIn ? "Старт с отсчётом" : "Старт"}
          </button>
          <button
            type="button"
            onClick={tap}
            className={cn(
              "h-[72px] w-[104px] shrink-0 rounded-lg border font-display text-[15px] font-bold uppercase transition-colors sm:w-[140px]",
              tapLit
                ? "border-accent bg-accent text-accent-ink"
                : "border-border-strong bg-bg-3 hover:border-accent"
            )}
          >
            Тап
          </button>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <Field label="Размер">
            <Segmented
              options={timeSignatures.map((ts) => ({ value: ts, label: ts }))}
              value={timeSignature}
              onChange={setTimeSignature}
            />
          </Field>
          <Field label="Деление доли">
            <Segmented
              options={SUBDIVISIONS}
              value={settings.subdivision}
              onChange={(v) => updateSettings({ subdivision: v })}
            />
          </Field>
        </div>
      </section>

      {/* Правая колонка */}
      <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        <Card title="Из репертуара" action={
          setlists.length > 0 && tracks.length > 0 ? (
            <Segmented
              options={[
                { value: "tracks" as const, label: "Треки" },
                { value: "setlist" as const, label: "Сет-лист" },
              ]}
              value={source}
              onChange={(v) => {
                setSource(v);
                if (v === "setlist") loadSetlistItem(setlist, findPlayable(setlist, 0, 1));
              }}
            />
          ) : null
        }>
          {tracks.length === 0 ? (
            <p className="text-sm text-text-secondary">
              У треков пока не указан темп.{" "}
              <Link href={songsHref} className="text-accent hover:underline">
                Указать в треках →
              </Link>
            </p>
          ) : source === "tracks" ? (
            <>
              {tracks.length > 8 && (
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Найти трек"
                  aria-label="Найти трек"
                  className="h-9 rounded-lg border border-border bg-bg-3 px-3 text-sm outline-none focus:border-accent"
                />
              )}
              <div className="-mx-1 flex max-h-[360px] flex-col gap-1 overflow-y-auto px-1">
                {filteredTracks.map((t, i) => (
                  <TrackRow
                    key={t.id}
                    pos={i + 1}
                    title={t.title}
                    meta={[t.songKey, t.timeSignature].filter(Boolean).join(" · ")}
                    bpm={t.bpm}
                    active={t.id === trackId}
                    onClick={() => loadTrack(t)}
                  />
                ))}
                {filteredTracks.length === 0 && (
                  <p className="py-2 text-sm text-text-muted">Ничего не нашлось</p>
                )}
              </div>
            </>
          ) : (
            <>
              {setlists.length > 1 ? (
                <select
                  value={setlistId ?? ""}
                  onChange={(e) => chooseSetlist(e.target.value)}
                  aria-label="Сет-лист"
                  className="h-9 rounded-lg border border-border bg-bg-3 px-2 text-sm outline-none focus:border-accent"
                >
                  {setlists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-semibold">{setlist?.name}</p>
              )}
              <p className="text-xs text-text-muted">После «Стоп» включится следующий трек</p>
              <div className="-mx-1 flex max-h-[360px] flex-col gap-1 overflow-y-auto px-1">
                {setlist?.items.map((item, i) => {
                  const t = item.trackId ? trackById.get(item.trackId) : undefined;
                  return (
                    <TrackRow
                      key={i}
                      pos={i + 1}
                      title={t?.title ?? item.title}
                      meta={
                        t
                          ? [t.songKey, t.timeSignature].filter(Boolean).join(" · ")
                          : "без темпа — пропускается"
                      }
                      bpm={t?.bpm}
                      active={i === setIdx && !!t && t.id === trackId}
                      disabled={!t}
                      onClick={() => loadSetlistItem(setlist, i)}
                    />
                  );
                })}
              </div>
              <div className="flex gap-2">
                <NavButton
                  onClick={() => loadSetlistItem(setlist, findPlayable(setlist, setIdx - 1, -1))}
                >
                  ← Пред.
                </NavButton>
                <NavButton
                  onClick={() => loadSetlistItem(setlist, findPlayable(setlist, setIdx + 1, 1))}
                >
                  След. →
                </NavButton>
              </div>
            </>
          )}
        </Card>

        <Card title="Тренировка">
          <div className="-mt-1 flex flex-col">
            <Toggle
              title="Отсчёт перед стартом"
              hint="Один такт, чтобы все вступили вместе"
              on={settings.countIn}
              onChange={(v) => updateSettings({ countIn: v })}
            />
            <Toggle
              title="Разгон темпа"
              hint={`+${settings.trainer.step} BPM ${everyBarsLabel(settings.trainer.everyBars)}, до ${settings.trainer.maxBpm}`}
              on={settings.trainer.enabled}
              onChange={(v) => updateSettings({ trainer: { ...settings.trainer, enabled: v } })}
            >
              <NumberField
                label="+BPM"
                value={settings.trainer.step}
                min={1}
                max={20}
                onChange={(step) => updateSettings({ trainer: { ...settings.trainer, step } })}
              />
              <NumberField
                label="каждые, тактов"
                value={settings.trainer.everyBars}
                min={1}
                max={32}
                onChange={(everyBars) =>
                  updateSettings({ trainer: { ...settings.trainer, everyBars } })
                }
              />
              <NumberField
                label="до BPM"
                value={settings.trainer.maxBpm}
                min={BPM_MIN}
                max={BPM_MAX}
                onChange={(maxBpm) => updateSettings({ trainer: { ...settings.trainer, maxBpm } })}
              />
            </Toggle>
            <Toggle
              title="Тихие такты"
              hint={`${settings.gap.playBars} с кликом, ${settings.gap.muteBars} без — проверка, держите ли темп сами`}
              on={settings.gap.enabled}
              onChange={(v) => updateSettings({ gap: { ...settings.gap, enabled: v } })}
            >
              <NumberField
                label="с кликом"
                value={settings.gap.playBars}
                min={1}
                max={16}
                onChange={(playBars) => updateSettings({ gap: { ...settings.gap, playBars } })}
              />
              <NumberField
                label="без клика"
                value={settings.gap.muteBars}
                min={1}
                max={16}
                onChange={(muteBars) => updateSettings({ gap: { ...settings.gap, muteBars } })}
              />
            </Toggle>
            <Toggle
              title="Вспышка на долю"
              hint="Пульт мигает — видно без наушников"
              on={settings.flash}
              onChange={(v) => updateSettings({ flash: v })}
            />
          </div>
        </Card>

        <Card title="Звук">
          <Segmented
            grid
            options={SOUND_ORDER.map((s) => ({ value: s, label: METRONOME_SOUND_LABELS[s] }))}
            value={settings.sound}
            onChange={(sound) => {
              updateSettings({ sound });
              if (!playing) click(3, sound);
            }}
          />
          <label className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="w-[76px] shrink-0">Громкость</span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="min-w-0 flex-1 accent-accent"
            />
            <span className="w-8 text-right tabular-nums">{settings.volume}</span>
          </label>
          {screenAwake && (
            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Sun className="h-3.5 w-3.5 text-accent" />
              Экран не гаснет, пока играет
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}

function everyBarsLabel(n: number) {
  if (n === 1) return "каждый такт";
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "такта" : "тактов";
  return `каждые ${n} ${word}`;
}

function StepButton({ label, aria, onClick }: { label: string; aria: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className="h-12 rounded-lg border border-border-strong bg-bg-3 text-[15px] font-semibold transition-colors hover:border-accent sm:h-14 sm:w-14"
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  grid,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  grid?: boolean;
}) {
  return (
    <div
      role="group"
      className={cn(
        "gap-0.5 rounded-lg border border-border bg-bg-3 p-0.5",
        grid ? "grid grid-cols-2" : "flex flex-wrap"
      )}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-[34px] whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
            o.value === value
              ? "bg-accent text-accent-ink"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-bg-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TrackRow({
  pos,
  title,
  meta,
  bpm,
  active,
  disabled,
  onClick,
}: {
  pos: number;
  title: string;
  meta: string;
  bpm?: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        active ? "border-border-strong bg-bg-4" : "border-transparent hover:bg-bg-3",
        disabled && "cursor-default text-text-muted hover:bg-transparent"
      )}
    >
      <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">{pos}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{title}</span>
        <span className="truncate text-xs text-text-secondary">{meta}</span>
      </span>
      {bpm !== undefined && (
        <span className={cn("font-display text-base font-bold", active && "text-accent")}>
          {bpm}
        </span>
      )}
    </button>
  );
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 flex-1 rounded-lg border border-border-strong bg-bg-3 text-sm font-semibold transition-colors hover:border-accent"
    >
      {children}
    </button>
  );
}

function Toggle({
  title,
  hint,
  on,
  onChange,
  children,
}: {
  title: string;
  hint: string;
  on: boolean;
  onChange: (on: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-bg-4 first:border-t-0">
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(!on)}
        className="flex w-full items-center gap-3 py-2.5 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-text-secondary">{hint}</span>
        </span>
        <span
          className={cn(
            "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
            on ? "bg-accent" : "bg-border-strong"
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] h-4 w-4 rounded-full transition-[left]",
              on ? "left-[19px] bg-accent-ink" : "left-[3px] bg-text-secondary"
            )}
          />
        </span>
      </button>
      {on && children && <div className="flex flex-wrap gap-2 pb-3">{children}</div>}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-text-secondary">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= min && n <= max) onChange(Math.round(n));
        }}
        className="h-8 w-14 rounded-md border border-border bg-bg-3 px-2 text-sm text-text-primary tabular-nums outline-none focus:border-accent"
      />
      {label}
    </label>
  );
}
