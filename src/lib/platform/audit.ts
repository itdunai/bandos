import { createClient } from "@/lib/supabase/server";

export type AuditLevel = "info" | "warn" | "error";

export type AuditEventInput = {
  level: AuditLevel;
  event: string;
  userId?: string | null;
  bandId?: string | null;
  meta?: Record<string, unknown>;
};

/** Fire-and-forget: не блокирует основной поток при сбое логирования. */
export async function logPlatformEvent(input: AuditEventInput) {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_platform_event", {
      p_level: input.level,
      p_event: input.event,
      p_user_id: input.userId ?? null,
      p_band_id: input.bandId ?? null,
      p_meta: input.meta ?? {},
    });
  } catch {
    // журнал не должен ломать бизнес-операции
  }
}

export function logPlatformEventAsync(input: AuditEventInput) {
  void logPlatformEvent(input);
}
