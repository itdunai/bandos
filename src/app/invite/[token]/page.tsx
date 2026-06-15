import Link from "next/link";
import { acceptInvitation } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { fetchInvitationByToken } from "@/lib/invitation";
import { createClient } from "@/lib/supabase/server";
import { INSTRUMENT_LABELS } from "@/types/database";
import { Mail, Users } from "lucide-react";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; confirm?: string; email?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const invitation = await fetchInvitationByToken(supabase, token);

  const { data: { user } } = await supabase.auth.getUser();

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <Card className="max-w-sm p-6 text-center">
          <h1 className="text-lg font-medium">Приглашение недействительно</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Ссылка устарела или уже использована.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-accent">
            На главную
          </Link>
        </Card>
      </div>
    );
  }

  const bandName = invitation.band_name ?? "группу";

  if (query.confirm === "1") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <Card className="max-w-sm p-6 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-accent" />
          <h1 className="text-lg font-medium">Подтвердите email</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Аккаунт для вступления в <strong>{bandName}</strong> создан.
            Проверьте почту{" "}
            {query.email && (
              <span className="text-text-primary">
                ({decodeURIComponent(query.email)})
              </span>
            )}{" "}
            и перейдите по ссылке.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            После подтверждения вернитесь сюда — вы автоматически попадёте в группу.
          </p>
          <Link href={`/invite/${token}`} className="mt-5 inline-block">
            <Button variant="accent" className="px-6 py-2.5">
              Вернуться к приглашению
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <Card className="max-w-sm p-6 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-accent" />
          <h1 className="text-lg font-medium">Приглашение в {bandName}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Вас пригласили как{" "}
            <span className="text-text-primary">
              {INSTRUMENT_LABELS[invitation.instrument]}
            </span>
          </p>

          {query.error && (
            <div className="mt-3 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
              {decodeURIComponent(query.error)}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <Link href={`/invite/${token}/join`}>
              <Button variant="accent" className="w-full py-2.5">
                Регистрация — новый участник
              </Button>
            </Link>
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>
              <Button className="w-full py-2.5">
                Войти — уже есть аккаунт
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="max-w-sm p-6 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-accent" />
        <h1 className="text-lg font-medium">Присоединиться к {bandName}?</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Вы вошли как участник с инструментом{" "}
          {INSTRUMENT_LABELS[invitation.instrument]}
        </p>

        {query.error && (
          <div className="mt-3 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
            {decodeURIComponent(query.error)}
          </div>
        )}

        <form action={acceptInvitation.bind(null, token)} className="mt-4">
          <SubmitButton type="submit" variant="accent" className="w-full py-2.5" loadingLabel="Вступление…">
            Принять приглашение
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
