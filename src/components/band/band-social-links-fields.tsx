"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUSTOM_LINK_LABEL_MAX,
  CUSTOM_LINKS_MAX,
  getCustomLinks,
  SOCIAL_PLATFORMS,
} from "@/lib/band/social-links";
import { SOCIAL_LABELS, type CustomSocialLink, type SocialLinks } from "@/types/database";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function BandSocialLinksFields({ initial }: { initial: SocialLinks }) {
  const [custom, setCustom] = useState<CustomSocialLink[]>(() =>
    getCustomLinks(initial)
  );

  const payload = custom
    .map((c) => ({ label: c.label.trim(), url: c.url.trim() }))
    .filter((c) => c.label || c.url);

  function update(index: number, field: keyof CustomSocialLink, value: string) {
    setCustom((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide">Соцсети и ссылки</h2>
        <p className="mt-1 text-xs text-text-muted">
          Отображаются на публичной странице группы. Нет нужной соцсети — добавьте
          свою ссылку ниже.
        </p>
      </div>

      {SOCIAL_PLATFORMS.map((key) => (
        <div key={key}>
          <Label>{SOCIAL_LABELS[key]}</Label>
          <Input
            name={`social_${key}`}
            type="url"
            defaultValue={initial[key] ?? ""}
            placeholder="https://..."
          />
        </div>
      ))}

      <input type="hidden" name="social_custom_json" value={JSON.stringify(payload)} />

      {custom.length > 0 && (
        <div className="space-y-3 pt-1">
          {custom.map((link, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-bg-3 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
            >
              <div>
                <Label>Название</Label>
                <Input
                  value={link.label}
                  maxLength={CUSTOM_LINK_LABEL_MAX}
                  required={!!link.url.trim()}
                  onChange={(e) => update(index, "label", e.target.value)}
                  placeholder="Яндекс Музыка"
                />
              </div>
              <div>
                <Label>Ссылка</Label>
                <Input
                  type="url"
                  value={link.url}
                  required={!!link.label.trim()}
                  onChange={(e) => update(index, "url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCustom((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Удалить ссылку"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {custom.length < CUSTOM_LINKS_MAX && (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setCustom((prev) => [...prev, { label: "", url: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить ссылку
        </Button>
      )}
    </section>
  );
}
