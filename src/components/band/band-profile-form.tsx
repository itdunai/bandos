"use client";

import { updateBandProfile } from "@/app/actions/band";
import { BandMediaSection } from "@/components/band/band-media-section";
import { ShareLinkButton } from "@/components/band/share-link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Band, SocialLinks } from "@/types/database";
import { SOCIAL_LABELS } from "@/types/database";

const SOCIAL_KEYS = Object.keys(SOCIAL_LABELS) as (keyof SocialLinks)[];

export function BandProfileForm({
  band,
  tracksCount,
  membersCount,
  riderSharePath,
}: {
  band: Band;
  tracksCount: number;
  membersCount: number;
  riderSharePath: string;
}) {
  const action = updateBandProfile.bind(null, band.id, band.slug);
  const links = (band.social_links ?? {}) as SocialLinks;

  return (
    <div className="space-y-5">
      <BandMediaSection
        bandId={band.id}
        bandSlug={band.slug}
        logoUrl={band.logo_url ?? null}
        photos={Array.isArray(band.photos) ? band.photos : []}
      />

      <form action={action} className="space-y-5">
      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <h2 className="text-sm font-medium">Основное</h2>
        <div>
          <Label>Название</Label>
          <Input name="name" required defaultValue={band.name} />
        </div>
        <div>
          <Label>Жанр</Label>
          <Input name="genre" defaultValue={band.genre ?? ""} placeholder="Alt-rock, indie..." />
        </div>
        <div>
          <Label>Описание</Label>
          <Textarea
            name="description"
            rows={4}
            defaultValue={band.description ?? ""}
            placeholder="Кто вы, откуда, как звучите..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-bg-3 px-3 py-2">
            <div className="text-[11px] text-text-muted">Треков в библиотеке</div>
            <div className="text-lg font-medium">{tracksCount}</div>
          </div>
          <div className="rounded-lg bg-bg-3 px-3 py-2">
            <div className="text-[11px] text-text-muted">Участников</div>
            <div className="text-lg font-medium">{membersCount}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Техрайдер</h2>
          <ShareLinkButton path={riderSharePath} label="Поделиться" />
        </div>
        <Textarea
          name="tech_rider"
          rows={8}
          defaultValue={band.tech_rider ?? ""}
          placeholder={"Барабанная установка: ...\nГитарный комбик: ...\nМониторы: 4 шт.\n..."}
          className="font-mono text-xs"
        />
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            name="rider_public"
            defaultChecked={band.rider_public ?? true}
            className="rounded border-border accent-accent"
          />
          Публичная ссылка на техрайдер (без входа в BandOS)
        </label>
      </section>

      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <h2 className="text-sm font-medium">Соцсети и ссылки</h2>
        {SOCIAL_KEYS.map((key) => (
          <div key={key}>
            <Label>{SOCIAL_LABELS[key]}</Label>
            <Input
              name={`social_${key}`}
              type="url"
              defaultValue={links[key] ?? ""}
              placeholder="https://..."
            />
          </div>
        ))}
      </section>

      <Button type="submit" variant="accent" className="px-6 py-2">
        Сохранить
      </Button>
    </form>
    </div>
  );
}
