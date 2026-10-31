"use client";

import { createEvent, deleteEvent, updateEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Event, EventType } from "@/types/database";
import { AlertCircle, Trash2 } from "lucide-react";
import { useRef, useState, useTransition, type FormEvent } from "react";

interface SetlistOption {
  id: string;
  name: string;
}

const selectClass =
  "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

function titlePlaceholder(type: EventType) {
  if (type === "rehearsal") return "Репетиция #43";
  if (type === "performance") return "Клуб Б2 · Live";
  return "Событие";
}

export function EventForm({
  bandId,
  bandSlug,
  event,
  setlists,
  defaultType = "rehearsal",
  defaultStartsAt,
  defaultTitle,
  defaultLocation,
  isAdmin = false,
  financeRecorded = false,
}: {
  bandId: string;
  bandSlug: string;
  event?: Event & { organizer?: string | null; fee?: number | null; rent?: number | null };
  setlists: SetlistOption[];
  defaultType?: EventType;
  defaultStartsAt?: string;
  defaultTitle?: string;
  defaultLocation?: string;
  isAdmin?: boolean;
  financeRecorded?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!event;
  const [eventType, setEventType] = useState<EventType>(
    event?.event_type ?? defaultType
  );
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // Смена даты начала → дата окончания подтягивается (см. DateTimeField.follow)
  const [startChange, setStartChange] = useState({ date: "", prev: "", seq: 0 });
  // «Учесть в финансах» включается, как только ввели сумму (пока галочку не трогали руками)
  const [recordFee, setRecordFee] = useState(!!event?.fee);
  const [recordRent, setRecordRent] = useState(!!event?.rent);
  const [recordTouched, setRecordTouched] = useState(false);

  const action = isEdit
    ? updateEvent.bind(null, event.id, bandId, bandSlug)
    : createEvent.bind(null, bandId, bandSlug);

  function showError(message: string) {
    setError(message);
    window.requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  }

  /**
   * Проверяем в браузере и отправляем без перезагрузки: при ошибке форма
   * остаётся заполненной (раньше сервер делал редирект на пустую страницу).
   */
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const startsAt = String(formData.get("starts_at") ?? "");
    const endsAt = String(formData.get("ends_at") ?? "");

    if (!title) return showError("Укажите название");
    if (!startsAt) return showError("Укажите дату и время начала");
    if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      return showError("Окончание должно быть позже начала — проверьте дату и время конца");
    }

    setError(null);
    startSaving(async () => {
      const result = await action(formData);
      if (result?.error) showError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <Label>Тип</Label>
        <select
          name="event_type"
          className={selectClass}
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
        >
          <option value="rehearsal">Репетиция</option>
          <option value="performance">Выступление</option>
          <option value="other">Другое</option>
        </select>
      </div>
      <div>
        <Label>Название *</Label>
        <Input
          name="title"
          required
          defaultValue={event?.title ?? defaultTitle}
          placeholder={titlePlaceholder(eventType)}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="event-starts-at">Начало *</Label>
          <DateTimeField
            id="event-starts-at"
            name="starts_at"
            required
            defaultIso={event?.starts_at}
            defaultLocal={defaultStartsAt}
            onDateChange={(date, prev) =>
              setStartChange((c) => ({ date, prev, seq: c.seq + 1 }))
            }
          />
        </div>
        <div>
          <Label htmlFor="event-ends-at">Конец</Label>
          <DateTimeField
            id="event-ends-at"
            name="ends_at"
            defaultIso={event?.ends_at}
            defaultTime="21:00"
            fallbackDateFrom="starts_at"
            follow={startChange}
          />
        </div>
      </div>
      <div>
        <Label>Место</Label>
        <Input name="location" defaultValue={event?.location ?? defaultLocation ?? ""} placeholder="Red Room Studio" />
      </div>
      <div>
        <Label>Заметки</Label>
        <Textarea name="notes" defaultValue={event?.notes ?? ""} rows={3} />
      </div>

      {eventType === "performance" && (
        <div className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
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
              <Input
                name="fee"
                type="number"
                min={0}
                defaultValue={event?.fee ?? ""}
                onChange={(e) => {
                  if (!recordTouched) setRecordFee(Number(e.target.value) > 0);
                }}
              />
            </div>
          </div>
          {isAdmin && !financeRecorded && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                name="record_in_finances"
                checked={recordFee}
                onChange={(e) => {
                  setRecordTouched(true);
                  setRecordFee(e.target.checked);
                }}
                className="accent-accent"
              />
              Учесть гонорар в финансах при сохранении
            </label>
          )}
          {financeRecorded && (
            <p className="text-xs text-accent">Гонорар уже учтён в разделе «Финансы»</p>
          )}
        </div>
      )}

      {eventType === "rehearsal" && (
        <div className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
          <div>
            <Label>Аренда (₽)</Label>
            <Input
              name="rent"
              type="number"
              min={0}
              defaultValue={event?.rent ?? ""}
              onChange={(e) => {
                if (!recordTouched) setRecordRent(Number(e.target.value) > 0);
              }}
            />
          </div>
          {isAdmin && !financeRecorded && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                name="record_rent_in_finances"
                checked={recordRent}
                onChange={(e) => {
                  setRecordTouched(true);
                  setRecordRent(e.target.checked);
                }}
                className="accent-accent"
              />
              Учесть аренду в финансах как расход
            </label>
          )}
          {financeRecorded && (
            <p className="text-xs text-accent">Аренда уже учтена в разделе «Финансы»</p>
          )}
        </div>
      )}

      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2.5 text-sm text-red"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="accent" className="px-6 py-2" loading={saving} disabled={saving}>
          {saving ? (isEdit ? "Сохранение…" : "Создание…") : isEdit ? "Сохранить" : "Создать"}
        </Button>
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
    </form>
  );
}
