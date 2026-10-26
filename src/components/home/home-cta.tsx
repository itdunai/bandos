import type { ReactNode } from "react";

export function HomeCta({ ctaSlot }: { ctaSlot: ReactNode }) {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-dark)_100%)] p-8 text-accent-ink sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="heading-poster text-2xl sm:text-3xl">Соберите группу в BandOS</h2>
            <p className="mt-2 max-w-xl opacity-85">
              Репертуар, сет-листы и график — в одном месте для всех участников. Бесплатно.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3 [&_a:first-child>button]:border-accent-ink [&_a:first-child>button]:bg-accent-ink [&_a:first-child>button]:text-accent [&_a:not(:first-child)>button]:border-accent-ink/40 [&_a:not(:first-child)>button]:bg-transparent [&_a:not(:first-child)>button]:text-accent-ink">
            {ctaSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
