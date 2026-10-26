import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Клиент с service role — в обход RLS. Только для серверных задач без
 * пользователя: webhook Telegram-бота и рассылка напоминаний. Никогда не
 * импортировать в клиентские компоненты и не использовать там, где действует
 * конкретный пользователь (для этого — createClient из ./server).
 */
export function createServiceSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("Service Supabase client is server-only");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
