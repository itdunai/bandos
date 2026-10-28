import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Аккаунт удалён",
  robots: { index: false, follow: false },
};

export default function AccountDeletedPage() {
  return (
    <Card className="p-6 text-center">
      <h1 className="text-lg font-medium">Аккаунт удалён</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Мы удалили ваш аккаунт и связанные с ним данные. Спасибо, что пользовались BandOS.
      </p>
      <Link href="/" className="mt-5 inline-block text-sm text-accent hover:underline">
        На главную
      </Link>
    </Card>
  );
}
