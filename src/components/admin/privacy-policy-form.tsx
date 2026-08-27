import { updatePrivacyPolicy } from "@/app/actions/site-pages";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MinimalEditor } from "@/components/ui/minimal-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { PRIVACY_PAGE_PATH, type SitePage } from "@/lib/legal/constants";
import Link from "next/link";

export function PrivacyPolicyForm({
  page,
  canSave,
}: {
  page: SitePage;
  canSave: boolean;
}) {
  return (
    <form action={updatePrivacyPolicy} className="space-y-4">
      <div>
        <Label htmlFor="privacy-title">Заголовок</Label>
        <Input
          id="privacy-title"
          name="title"
          required
          maxLength={200}
          defaultValue={page.title}
          disabled={!canSave}
        />
      </div>
      <div>
        <Label htmlFor="privacy-body">Текст</Label>
        <p className="mb-2 text-[11px] text-text-muted">
          Разметка: **жирный**, *курсив*, ## заголовок, списки. Данные в
          [квадратных скобках] замените на реквизиты оператора. HTML не
          поддерживается.
        </p>
        <MinimalEditor
          name="body"
          defaultValue={page.body}
          rows={22}
          className={!canSave ? "pointer-events-none opacity-60" : undefined}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          type="submit"
          variant="accent"
          disabled={!canSave}
          loadingLabel="Сохранение…"
        >
          Сохранить
        </SubmitButton>
        <Link
          href={PRIVACY_PAGE_PATH}
          className="text-xs text-text-secondary hover:text-accent"
        >
          Открыть на сайте
        </Link>
      </div>
    </form>
  );
}
