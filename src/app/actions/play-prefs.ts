"use server";

import { parsePlayTextPrefs, type PlayTextPrefs } from "@/lib/play/text-prefs";
import { createClient } from "@/lib/supabase/server";

/** Настройки текста «Играем» в профиль — чтобы были теми же на другом устройстве. */
export async function savePlayTextPrefs(prefs: PlayTextPrefs): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // До миграции 033 колонки нет — тогда настройки живут только в браузере
  await supabase
    .from("profiles")
    .update({ play_prefs: parsePlayTextPrefs(prefs) })
    .eq("id", user.id);
}
