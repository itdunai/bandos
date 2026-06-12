import Link from "next/link";
import { signUpAccount } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Guitar, Mail } from "lucide-react";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string; email?: string }>;
}) {
  const params = await searchParams;

  if (params.confirm === "1") {
    return (
      <Card className="p-6 text-center">
        <Mail className="mx-auto mb-3 h-10 w-10 text-accent" />
        <h1 className="text-lg font-medium">Подтвердите email</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Аккаунт создан. На{" "}
          <span className="text-text-primary">
            {params.email ? decodeURIComponent(params.email) : "ваш email"}
          </span>{" "}
          отправлена ссылка — перейдите по ней, затем войдите.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          После входа вы сможете создать группу или принять приглашение.
        </p>
        <Link href="/login" className="mt-5 inline-block">
          <Button variant="accent" className="px-6 py-2.5">
            Перейти ко входу
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dark">
          <Guitar className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-medium">Регистрация</h1>
        <p className="text-center text-xs text-text-secondary">
          Создайте аккаунт BandOS
        </p>
      </div>

      {params.error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={signUpAccount} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Ваше имя</label>
          <Input name="display_name" required placeholder="Алекс К." />
        </div>
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
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" variant="accent" className="w-full py-2.5">
          Зарегистрироваться
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
      <p className="mt-2 text-center text-[11px] text-text-muted">
        Хотите завести группу?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войдите
        </Link>{" "}
        и создайте её — или зарегистрируйтесь и перейдите в «Создать группу».
      </p>
    </Card>
  );
}
