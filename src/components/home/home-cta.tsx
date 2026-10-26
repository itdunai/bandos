import type { ReactNode } from "react";

export function HomeCta({ ctaSlot }: { ctaSlot: ReactNode }) {
  return (
    <section className="px-4 pb-6 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-border bg-bg-2 px-6 py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_srgb,var(--accent)_55%,transparent),transparent_60%)]"
        />
        <h2 className="heading-poster relative text-[44px] font-black leading-[0.86] sm:text-7xl lg:text-[96px]">
          Ваша сцена
          <br />
          ждёт
        </h2>
        <p className="relative mx-auto mb-8 mt-6 max-w-lg text-lg text-text-secondary">
          Соберите группу в BandOS — репертуар, сет-листы и график в одном месте
          для всех участников.
        </p>
        <div className="relative flex flex-wrap justify-center gap-3">{ctaSlot}</div>
      </div>
    </section>
  );
}
