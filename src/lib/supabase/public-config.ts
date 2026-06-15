export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export const PUBLIC_CONFIG_SCRIPT_ID = "__BANDOS_PUBLIC_CONFIG__";

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured(
  config: SupabasePublicConfig = getSupabasePublicConfig()
) {
  return Boolean(config.url && config.anonKey);
}

export function readClientSupabaseConfig(): SupabasePublicConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(PUBLIC_CONFIG_SCRIPT_ID);
  if (!el?.textContent) return null;

  try {
    const parsed = JSON.parse(el.textContent) as Partial<SupabasePublicConfig>;
    const url = parsed.url?.trim() ?? "";
    const anonKey = parsed.anonKey?.trim() ?? "";
    if (!url || !anonKey) return null;
    return { url, anonKey };
  } catch {
    return null;
  }
}
