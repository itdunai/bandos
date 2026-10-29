import { FeedbackForm } from "@/components/feedback/feedback-form";
import { MyFeedbackList } from "@/components/feedback/my-feedback-list";
import { AppShell } from "@/components/layout/app-shell";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { getMyFeedback } from "@/lib/feedback/tickets";
import { bandPath } from "@/lib/paths";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Обратная связь" };

export default async function BandFeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ from?: string; error?: string; sent?: string }>;
}) {
  const { bandSlug } = await params;
  const query = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feedback");

  const [member, memberCount, myFeedback] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    getMyFeedback(supabase, user.id),
  ]);

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Обратная связь"
      subtitle="Ошибки, идеи и вопросы — статус и ответ появятся здесь"
    >
      <div className="grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-start">
        <FeedbackForm
          returnTo={bandPath(band.slug, "feedback")}
          from={sanitizeRedirectPath(query.from)}
          band={{ id: band.id, name: band.name }}
          error={query.error}
          sent={query.sent === "1"}
        />
        <MyFeedbackList items={myFeedback} />
      </div>
    </AppShell>
  );
}
