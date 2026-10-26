"use client";

import { updateBandProfile } from "@/app/actions/band";
import { BandContactsFields } from "@/components/band/band-contacts-fields";
import { BandSocialLinksFields } from "@/components/band/band-social-links-fields";
import { BandMediaSection } from "@/components/band/band-media-section";
import { PublicPageShare } from "@/components/band/public-page-share";
import { ShareLinkButton } from "@/components/band/share-link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinimalEditor } from "@/components/ui/minimal-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Band, BandContact, SocialLinks } from "@/types/database";

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
  const contacts = (band.contacts ?? []) as BandContact[];

  return (
    <div className="space-y-5">
      <BandMediaSection
        bandId={band.id}
        bandSlug={band.slug}
        logoUrl={band.logo_url ?? null}
        photos={Array.isArray(band.photos) ? band.photos : []}
      />

      <PublicPageShare path={riderSharePath} />

      <form action={action} className="space-y-5">
      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide">Основное</h2>
        <div>
          <Label>Название</Label>
          <Input name="name" required defaultValue={band.name} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Жанр</Label>
            <Input name="genre" defaultValue={band.genre ?? ""} placeholder="Alt-rock, indie..." />
          </div>
          <div>
            <Label>Город</Label>
            <Input name="city" defaultValue={band.city ?? ""} placeholder="Москва" />
          </div>
        </div>
        <div>
          <Label>Описание</Label>
          <textarea
            name="description"
            rows={4}
            defaultValue={band.description ?? ""}
            placeholder="Кто вы, откуда, как звучите..."
            className="w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-bg-3 px-3 py-2">
            <div className="text-xs text-text-muted">Треков в библиотеке</div>
            <div className="text-lg font-medium">{tracksCount}</div>
          </div>
          <div className="rounded-lg bg-bg-3 px-3 py-2">
            <div className="text-xs text-text-muted">Участников</div>
            <div className="text-lg font-medium">{membersCount}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide">Техрайдер</h2>
          <ShareLinkButton path={riderSharePath} label="Поделиться" />
        </div>
        <MinimalEditor
          name="tech_rider"
          defaultValue={band.tech_rider ?? ""}
          placeholder={"Барабанная установка: ...\nГитарный комбик: ...\nМониторы: 4 шт.\n..."}
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

      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wide">Заявки на выступления</h2>
        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="accept_bookings"
            defaultChecked={band.accept_bookings ?? false}
            className="mt-0.5 rounded border-border accent-accent"
          />
          <span>
            Показывать на публичной странице кнопку «Заказать выступление».
            Заявки появятся в разделе «Заявки» и придут в Telegram тем, у кого
            подключены уведомления.
          </span>
        </label>
      </section>

      <BandContactsFields initial={contacts} />

      <BandSocialLinksFields initial={links} />

      <SubmitButton type="submit" variant="accent" className="px-6 py-2" loadingLabel="Сохранение…">
        Сохранить
      </SubmitButton>
    </form>
    </div>
  );
}
