import type { Metadata } from "next";
import { updatePassword } from "@/app/actions/auth";
import { SiteLogo } from "@/components/brand/site-logo";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Новый пароль",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <SiteLogo className="h-14" />
        <h1 className="text-lg font-medium">Новый пароль</h1>
        <p className="text-center text-xs text-text-secondary">
          Придумайте пароль для входа в BandOS
        </p>
      </div>

      {params.error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={updatePassword} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Новый пароль</label>
          <Input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Повторите пароль</label>
          <Input
            name="password_confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <SubmitButton
          type="submit"
          variant="accent"
          className="w-full py-2.5"
          loadingLabel="Сохраняем…"
        >
          Сохранить пароль
        </SubmitButton>
      </form>
    </Card>
  );
}
