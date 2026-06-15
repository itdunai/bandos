"use client";

import { createEvent, deleteEvent, updateEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { FormPending } from "@/components/ui/form-pending";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { Event, EventType } from "@/types/database";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface SetlistOption {
  id: string;
  name: string;
}

const selectClass =
  "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  bandId,
  bandSlug,
  event,
  setlists,
  defaultType = "rehearsal",
  defaultStartsAt,
  isAdmin = false,
  financeRecorded = false,
}: {
  bandId: string;
  bandSlug: string;
  event?: Event & { organizer?: string | null; fee?: number | null };
  setlists: SetlistOption[];
  defaultType?: EventType;
  defaultStartsAt?: string;
  isAdmin?: boolean;
  financeRecorded?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!event;
  const type = event?.event_type ?? defaultType;

  const action = isEdit
    ? updateEvent.bind(null, event.id, bandId, bandSlug)
    : createEvent.bind(null, bandId, bandSlug);

  return (
    <form action={action} className="space-y-4">
      <FormPending label={isEdit ? "Сохранение…" : "Создание…"}>
      <div>
        <Label>Тип</Label>
        <select name="event_type" className={selectClass} defaultValue={type}>
          <option value="rehearsal">Репетиция</option>
          <option value="performance">Выступление</option>
        </select>
      </div>
      <div>
        <Label>Название *</Label>
        <Input
          name="title"
          required
          defaultValue={event?.title}
          placeholder={type === "rehearsal" ? "Репетиция #43" : "Клуб Б2 · Live"}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Начало *</Label>
          <Input
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={
              toDatetimeLocal(event?.starts_at) ||
              defaultStartsAt ||
              ""
            }
          />
        </div>
        <div>
          <Label>Конец</Label>
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event?.ends_at)}
          />
        </div>
      </div>
      <div>
        <Label>Место</Label>
        <Input name="location" defaultValue={event?.location ?? ""} placeholder="Red Room Studio" />
      </div>
      <div>
        <Label>Заметки</Label>
        <Textarea name="notes" defaultValue={event?.notes ?? ""} rows={3} />
      </div>

      <div className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <p className="text-xs text-text-muted">Только для выступлений</p>
        <div>
          <Label>Сет-лист</Label>
          <select name="setlist_id" className={selectClass} defaultValue={event?.setlist_id ?? ""}>
            <option value="">— не выбран —</option>
            {setlists.map((sl) => (
              <option key={sl.id} value={sl.id}>{sl.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Организатор</Label>
            <Input name="organizer" defaultValue={event?.organizer ?? ""} />
          </div>
          <div>
            <Label>Гонорар (₽)</Label>
            <Input name="fee" type="number" min={0} defaultValue={event?.fee ?? ""} />
          </div>
        </div>
        {isAdmin && !financeRecorded && (
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="record_in_finances"
              defaultChecked={!!event?.fee}
              className="accent-accent"
            />
            Учесть гонорар в финансах при сохранении
          </label>
        )}
        {financeRecorded && (
          <p className="text-xs text-accent">Гонорар уже учтён в разделе «Финансы»</p>
        )}
      </div>

      <div className="flex gap-2">
        <SubmitButton type="submit" variant="accent" className="px-6 py-2" loadingLabel={isEdit ? "Сохранение…" : "Создание…"}>
          {isEdit ? "Сохранить" : "Создать"}
        </SubmitButton>
        {isEdit && (
          <Button
            type="button"
            variant="default"
            className="text-red hover:border-red"
            loading={pending}
            disabled={pending}
            onClick={() => {
              if (confirm("Удалить событие?")) {
                startTransition(() => deleteEvent(event.id, bandSlug));
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {pending ? "Удаление…" : "Удалить"}
          </Button>
        )}
      </div>
      </FormPending>
    </form>
  );
}
