"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let browserConfig: { url: string; anonKey: string } | null = null;

function resolveConfig(url?: string, anonKey?: string) {
  const resolvedUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const resolvedKey =
    anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!resolvedUrl || !resolvedKey) {
    throw new Error(
      "Supabase не настроен. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url: resolvedUrl, anonKey: resolvedKey };
}

export function createClient(url?: string, anonKey?: string) {
  const next = resolveConfig(url, anonKey);

  if (
    !browserClient ||
    !browserConfig ||
    browserConfig.url !== next.url ||
    browserConfig.anonKey !== next.anonKey
  ) {
    browserConfig = next;
    browserClient = createBrowserClient(next.url, next.anonKey);
  }

  return browserClient;
}
