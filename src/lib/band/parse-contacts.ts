import type { BandContact } from "@/types/database";

export function parseContactsJson(raw: FormDataEntryValue | null): BandContact[] {
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        name: String((item as BandContact)?.name ?? "").trim(),
        phone: String((item as BandContact)?.phone ?? "").trim(),
      }))
      .filter((c) => c.name && c.phone)
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function normalizeContacts(raw: unknown): BandContact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      name: String((item as BandContact)?.name ?? "").trim(),
      phone: String((item as BandContact)?.phone ?? "").trim(),
    }))
    .filter((c) => c.name && c.phone);
}
