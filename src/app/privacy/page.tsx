import { PrivacyPolicyView } from "@/components/legal/privacy-policy-view";
import { getCachedPrivacyPage, PRIVACY_PAGE_PATH } from "@/lib/legal/site-pages";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedPrivacyPage();
  return {
    title: `${page.title} — BandOS`,
    description:
      "Политика в отношении обработки персональных данных и файлов cookie сервиса BandOS.",
    alternates: { canonical: PRIVACY_PAGE_PATH },
  };
}

export default async function PrivacyPage() {
  const page = await getCachedPrivacyPage();
  return <PrivacyPolicyView page={page} />;
}
