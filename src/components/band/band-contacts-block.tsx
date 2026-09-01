import type { BandContact } from "@/types/database";
import { Phone } from "lucide-react";

export function BandContactsBlock({ contacts }: { contacts: BandContact[] }) {
  if (contacts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <h3 className="mb-2 text-sm font-medium">Контакты для связи</h3>
      <ul className="space-y-2">
        {contacts.map((contact, index) => {
          const tel = contact.phone.replace(/\s/g, "");
          return (
            <li key={`${contact.name}-${index}`}>
              <a
                href={`tel:${tel}`}
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {contact.name}
                  <span className="text-text-secondary"> · </span>
                  {contact.phone}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
