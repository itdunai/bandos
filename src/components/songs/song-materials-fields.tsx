"use client";

import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const materialTextareaClass = "font-mono min-h-[280px] text-sm";

export function SongMaterialsFields({
  chords,
  tabs,
  lyrics,
}: {
  chords?: string;
  tabs?: string;
  lyrics?: string;
}) {
  return (
    <Tabs
      tabs={[
        {
          id: "chords",
          label: "Аккорды",
          content: (
            <Textarea
              name="chords"
              defaultValue={chords ?? ""}
              placeholder="Em — C — G — D"
              className={materialTextareaClass}
              rows={14}
            />
          ),
        },
        {
          id: "tabs",
          label: "Табы (бас)",
          content: (
            <Textarea
              name="tabs"
              defaultValue={tabs ?? ""}
              placeholder="G|----------------|"
              className={materialTextareaClass}
              rows={14}
            />
          ),
        },
        {
          id: "lyrics",
          label: "Текст",
          content: (
            <Textarea
              name="lyrics"
              defaultValue={lyrics ?? ""}
              placeholder={"[Куплет]\nТекст песни..."}
              className="min-h-[280px] text-sm"
              rows={14}
            />
          ),
        },
      ]}
    />
  );
}
