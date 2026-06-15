import type { SupabasePublicConfig } from "@/lib/supabase/public-config";
import { PUBLIC_CONFIG_SCRIPT_ID } from "@/lib/supabase/public-config";

export function PublicConfigScript({
  config,
}: {
  config: SupabasePublicConfig;
}) {
  if (!config.url || !config.anonKey) return null;

  return (
    <script
      id={PUBLIC_CONFIG_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(config),
      }}
    />
  );
}
