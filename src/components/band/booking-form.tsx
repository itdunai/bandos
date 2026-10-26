"use client";

import { submitBookingRequest, type BookingFormState } from "@/app/actions/bookings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarHeart, CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";

export function BookingForm({ bandSlug, bandName }: { bandSlug: string; bandName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<BookingFormState, FormData>(
    submitBookingRequest.bind(null, bandSlug),
    { status: "idle" }
  );

  if (state.status === "success") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green/30 bg-green/10 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
        <div>
          <p className="font-medium">Заявка отправлена</p>
          <p className="mt-1 text-sm text-text-secondary">
            {bandName} свяжется с вами по указанному контакту.
          </p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-bg-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="heading-poster text-base">Пригласить на мероприятие</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Свадьба, корпоратив, клуб или фестиваль — оставьте заявку.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-dark"
        >
          <CalendarHeart className="h-4 w-4" />
          Заказать выступление
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="relative space-y-3 rounded-xl border border-border bg-bg-2 p-5">
      <h2 className="heading-poster text-base">Заявка на выступление</h2>
      {/* Ловушка для ботов: люди это поле не видят и не заполняют. */}
      <div aria-hidden className="absolute -left-[10000px] h-0 w-0 overflow-hidden">
        <label>
          Сайт
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="bk-name">Как к вам обращаться *</Label>
          <Input id="bk-name" name="name" required maxLength={100} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="bk-contact">Телефон, e-mail или Telegram *</Label>
          <Input id="bk-contact" name="contact" required minLength={3} maxLength={200} />
        </div>
        <div>
          <Label htmlFor="bk-date">Дата мероприятия</Label>
          <Input id="bk-date" name="event_date" type="date" />
        </div>
        <div>
          <Label htmlFor="bk-city">Город</Label>
          <Input id="bk-city" name="city" maxLength={100} />
        </div>
      </div>
      <div>
        <Label htmlFor="bk-format">Формат</Label>
        <Input
          id="bk-format"
          name="event_format"
          maxLength={100}
          placeholder="Свадьба, корпоратив, клуб…"
        />
      </div>
      <div>
        <Label htmlFor="bk-message">Подробности</Label>
        <Textarea
          id="bk-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Площадка, количество гостей, длительность, пожелания по репертуару"
        />
      </div>
      {state.status === "error" && (
        <p className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
          {state.message}
        </p>
      )}
      <p className="text-xs text-text-muted">
        Контакты увидят только участники группы — чтобы связаться с вами по заявке.
      </p>
      <SubmitButton variant="accent" size="lg" loadingLabel="Отправка…">
        Отправить заявку
      </SubmitButton>
    </form>
  );
}
