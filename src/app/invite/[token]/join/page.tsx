import Link from "next/link";
import { signUpFromInvite } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { fetchInvitationByToken } from "@/lib/invitation";
import { createClient } from "@/lib/supabase/server";
import { PRESET_META } from "@/lib/band/permissions";
import { INSTRUMENT_LABELS } from "@/types/database";
import type { PermissionPreset } from "@/types/database";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InviteJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(`/invite/${token}`);
  }

  const invitation = await fetchInvitationByToken(supabase, token);

  if (!invitation) {
    redirect(`/invite/${token}`);
  }

  const bandName = invitation.band_name ?? "группу";
  const action = signUpFromInvite.bind(null, token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-accent" />
          <h1 className="text-lg font-medium">Регистрация в {bandName}</h1>
          <p className="mt-1 text-xs text-text-secondary">
            Создайте аккаунт, чтобы присоединиться к группе
          </p>
          <div className="mt-2 flex justify-center gap-2 text-[11px] text-text-muted">
            <span>
              {invitation.permission_preset === "custom"
                ? "Свои права"
                : PRESET_META[
                    (invitation.permission_preset ?? "musician") as Exclude<
                      PermissionPreset,
                      "custom"
                    >
                  ].label}
            </span>
            <span>·</span>
            <span>{INSTRUMENT_LABELS[invitation.instrument]}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
            {decodeURIComponent(error)}
            {decodeURIComponent(error).toLowerCase().includes("лимит") && (
              <p className="mt-2 text-text-secondary">
                Уже есть аккаунт?{" "}
                <Link
                  href={`/login?next=/invite/${token}`}
                  className="text-accent hover:underline"
                >
                  Войти
                </Link>
              </p>
            )}
          </div>
        )}

        <form action={action} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Ваше имя</label>
            <Input name="display_name" required placeholder="Дима М." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Email</label>
            <Input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={invitation.email ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Пароль</label>
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <SubmitButton type="submit" variant="accent" className="w-full py-2.5" loadingLabel="Регистрация…">
            Зарегистрироваться и вступить
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Уже есть аккаунт?{" "}
          <Link href={`/login?next=/invite/${token}`} className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
}
