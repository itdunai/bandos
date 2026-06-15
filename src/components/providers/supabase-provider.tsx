"use client";

import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SupabasePublicConfig } from "@/lib/supabase/public-config";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({
  config,
  children,
}: {
  config: SupabasePublicConfig;
  children: ReactNode;
}) {
  const client = useMemo(
    () =>
      config.url && config.anonKey
        ? createBrowserSupabaseClient(config.url, config.anonKey)
        : null,
    [config.url, config.anonKey]
  );

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error(
      "Supabase не настроен. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
}
