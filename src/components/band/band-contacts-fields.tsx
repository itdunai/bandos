"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BandContact } from "@/types/database";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function BandContactsFields({
  initial,
}: {
  initial: BandContact[];
}) {
  const [contacts, setContacts] = useState<BandContact[]>(
    initial.length > 0 ? initial : [{ name: "", phone: "" }]
  );

  const payload = contacts
    .map((c) => ({
      name: c.name.trim(),
      phone: c.phone.trim(),
    }))
    .filter((c) => c.name || c.phone);

  function update(index: number, field: keyof BandContact, value: string) {
    setContacts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addRow() {
    setContacts((prev) => [...prev, { name: "", phone: "" }]);
  }

  function removeRow(index: number) {
    setContacts((prev) =>
      prev.length <= 1 ? [{ name: "", phone: "" }] : prev.filter((_, i) => i !== index)
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
      <div>
        <h2 className="text-sm font-medium">Контакты для связи</h2>
        <p className="mt-1 text-xs text-text-muted">
          Имя и телефон — для заказчиков и площадок. Отображаются на публичной
          странице группы.
        </p>
      </div>

      <input type="hidden" name="contacts_json" value={JSON.stringify(payload)} />

      <div className="space-y-3">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-bg-3 p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <Label>Имя</Label>
              <Input
                value={contact.name}
                onChange={(e) => update(index, "name", e.target.value)}
                placeholder="Алексей"
              />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input
                type="tel"
                value={contact.phone}
                onChange={(e) => update(index, "phone", e.target.value)}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                aria-label="Удалить контакт"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="default" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Добавить контакт
      </Button>
    </section>
  );
}
