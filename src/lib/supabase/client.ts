"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  readClientSupabaseConfig,
  type SupabasePublicConfig,
} from "@/lib/supabase/public-config";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let browserConfig: SupabasePublicConfig | null = null;

function resolveConfig(url?: string, anonKey?: string): SupabasePublicConfig {
  if (url && anonKey) {
    return { url, anonKey };
  }

  if (browserConfig) {
    return browserConfig;
  }

  const injected = readClientSupabaseConfig();
  if (injected) {
    return injected;
  }

  const resolvedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const resolvedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!resolvedUrl || !resolvedKey) {
    throw new Error(
      "Supabase не настроен. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY и перезапустите сервер."
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
