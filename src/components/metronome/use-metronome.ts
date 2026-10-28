"use client";

import {
  IDLE_PULSE,
  MetronomeEngine,
  type MetronomeEngineConfig,
  type MetronomePulse,
} from "@/lib/metronome/engine";
import type { MetronomeSound } from "@/lib/metronome-sounds";
import type { AccentLevel } from "@/lib/metronome/rhythm";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Метроном поверх MetronomeEngine. Темп и доли — у вызывающего компонента;
 * разгон («Тренировка») сообщает новый темп через onTrainerBpm.
 */
export function useMetronome({
  bpm,
  config,
  onTrainerBpm,
}: {
  bpm: number;
  config: MetronomeEngineConfig;
  onTrainerBpm?: (bpm: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [pulse, setPulse] = useState<MetronomePulse>(IDLE_PULSE);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const configRef = useRef(config);
  const bpmRef = useRef(bpm);
  const onTrainerRef = useRef(onTrainerBpm);

  useEffect(() => {
    configRef.current = config;
    onTrainerRef.current = onTrainerBpm;
  });

  useEffect(() => {
    bpmRef.current = bpm;
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    const engine = new MetronomeEngine(
      () => configRef.current,
      (next, trainerBpm) => {
        setPulse(next);
        if (trainerBpm !== null) onTrainerRef.current?.(trainerBpm);
      }
    );
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    engineRef.current?.start(bpmRef.current);
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setPlaying(false);
    setPulse(IDLE_PULSE);
  }, []);

  const click = useCallback((level?: AccentLevel, sound?: MetronomeSound) => {
    engineRef.current?.click(level, sound);
  }, []);

  return { playing, pulse, start, stop, click };
}
