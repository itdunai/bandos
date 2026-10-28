"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Настраиваем гитары…",
  "Подключаем кабели…",
  "Проверяем звук…",
  "Раз, два, три — поехали…",
];

const BARS = [0.55, 0.9, 0.4, 1, 0.65, 0.8, 0.45];

/**
 * Лоадер страницы в теме проекта: эквалайзер и меняющиеся «музыкальные» фразы.
 * Если передан `label` — показываем его вместо фраз.
 */
export function PageLoader({ label }: { label?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (label) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % PHRASES.length), 1400);
    return () => window.clearInterval(t);
  }, [label]);

  const text = label ?? PHRASES[i];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-5 p-12"
    >
      <div aria-hidden className="flex h-12 items-end gap-1.5">
        {BARS.map((h, n) => (
          <span
            key={n}
            className="eq-bar w-2 rounded-sm bg-accent"
            style={{
              height: `${h * 100}%`,
              animationDelay: `${n * -0.17}s`,
              animationDuration: `${0.9 + (n % 3) * 0.18}s`,
            }}
          />
        ))}
      </div>
      <p key={text} className="eq-fade font-display text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">
        {text}
      </p>
    </div>
  );
}
