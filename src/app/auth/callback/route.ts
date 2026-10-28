import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { NextResponse } from "next/server";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Ссылки из писем Supabase. Два варианта:
 * - ?token_hash=&type= — шаблоны из docs/email-setup.md; работают, даже если
 *   письмо открыли в другом браузере или на другом устройстве;
 * - ?code= — PKCE (стандартные шаблоны), только в том же браузере.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get("next")) ?? "/";
  const isRecovery = type === "recovery" || next === "/reset-password";

  const supabase = await createClient();

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${encodeURI(isRecovery ? "/reset-password" : next)}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${encodeURI(next)}`);
    }
  }

  if (isRecovery) {
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent("Ссылка устарела или уже использована — запросите новую")}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Ссылка устарела или уже использована. Попробуйте войти")}`
  );
}
