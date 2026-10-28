import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { SiteLogo } from "@/components/brand/site-logo";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
}) {
  const params = await searchParams;

  if (params.sent === "1") {
    return (
      <Card className="p-6 text-center">
        <Mail className="mx-auto mb-3 h-10 w-10 text-accent" />
        <h1 className="text-lg font-medium">Проверьте почту</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Если аккаунт{" "}
          <span className="text-text-primary">
            {params.email ? decodeURIComponent(params.email) : "с этим email"}
          </span>{" "}
          существует, мы отправили на него ссылку для смены пароля.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Письма нет несколько минут — загляните в «Спам» или попробуйте ещё раз.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm text-accent hover:underline"
        >
          Вернуться ко входу
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <SiteLogo className="h-14" />
        <h1 className="text-lg font-medium">Восстановление пароля</h1>
        <p className="text-center text-xs text-text-secondary">
          Укажите email — пришлём ссылку для смены пароля
        </p>
      </div>

      {params.error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={requestPasswordReset} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Email</label>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={params.email ? decodeURIComponent(params.email) : undefined}
          />
        </div>
        <SubmitButton
          type="submit"
          variant="accent"
          className="w-full py-2.5"
          loadingLabel="Отправляем…"
        >
          Отправить ссылку
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Вспомнили пароль?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </Card>
  );
}
