import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { Card, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { OwnedBand } from "@/lib/account/owned-bands";

export function AccountLoginCard({ email }: { email: string }) {
  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <CardTitle>Вход</CardTitle>
      <div className="text-sm">
        <div className="text-xs text-text-muted">Email</div>
        <div className="break-all">{email}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/reset-password"
          className="rounded-lg border border-border-strong px-3.5 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
        >
          Сменить пароль
        </Link>
        <form action={signOut}>
          <SubmitButton type="submit" variant="ghost" loadingLabel="Выход…">
            Выйти
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}

export function AccountDeleteCard({
  email,
  ownedBands,
}: {
  email: string;
  ownedBands: OwnedBand[];
}) {
  return (
    <Card className="space-y-3 border-red/30 p-4 sm:p-5">
      <CardTitle className="text-red">Удаление аккаунта</CardTitle>
      <p className="text-sm text-text-secondary">
        Аккаунт и профиль будут удалены безвозвратно. Из групп, куда вас
        пригласили, вы выйдете — их данные останутся у остальных участников.
      </p>
      {ownedBands.length > 0 && (
        <div className="rounded-lg border border-red/30 bg-red/5 p-3 text-sm">
          <div className="font-medium text-red">
            Вместе с аккаунтом удалятся созданные вами группы со всеми треками,
            сет-листами, графиком и финансами:
          </div>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-text-secondary">
            {ownedBands.map((b) => (
              <li key={b.id}>
                {b.name}
                {b.memberCount > 1 && (
                  <span className="text-text-muted">
                    {" "}
                    — ещё {b.memberCount - 1} участн.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <DeleteAccountForm email={email} />
    </Card>
  );
}
