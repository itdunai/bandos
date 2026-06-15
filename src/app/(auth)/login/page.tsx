import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Guitar } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dark">
          <Guitar className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-medium">Вход в BandOS</h1>
        <p className="text-center text-xs text-text-secondary">
          Репетиции, треки, сет-листы — всё в одном месте
        </p>
      </div>

      {params.error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={signIn} className="space-y-3">
        {params.next && (
          <input type="hidden" name="next" value={params.next} />
        )}
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Email</label>
          <Input name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Пароль</label>
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <SubmitButton type="submit" variant="accent" className="w-full py-2.5" loadingLabel="Вход…">
          Войти
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Регистрация
        </Link>
      </p>
      <p className="mt-2 text-center text-[11px] text-text-muted">
        Хотите завести группу?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Зарегистрируйтесь
        </Link>
        , затем{" "}
        <Link href="/new-band" className="text-accent hover:underline">
          создайте группу
        </Link>
        .
      </p>
    </Card>
  );
}
