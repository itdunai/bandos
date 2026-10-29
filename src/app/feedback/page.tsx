import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { MyFeedbackList } from "@/components/feedback/my-feedback-list";
import { getUserBands } from "@/lib/band/queries";
import { getMyFeedback } from "@/lib/feedback/tickets";
import { bandPath } from "@/lib/paths";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Обратная связь",
  robots: { index: false, follow: false },
};

/** Обратная связь без группы. Участников ведём в раздел внутри группы — с меню. */
export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feedback");

  const from = sanitizeRedirectPath(params.from);
  const userBands = await getUserBands();
  if (userBands.length > 0) {
    // Группа, из которой пришли (/{slug}/...), иначе первая
    const slug = from?.split("/")[1];
    const band = userBands.find((b) => b.slug === slug) ?? userBands[0];
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (params.error) query.set("error", params.error);
    if (params.sent) query.set("sent", params.sent);
    const qs = query.toString();
    redirect(`${bandPath(band.slug, "feedback")}${qs ? `?${qs}` : ""}`);
  }

  const myFeedback = await getMyFeedback(supabase, user.id);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold">Обратная связь</h1>
      <FeedbackForm
        returnTo="/feedback"
        from={from}
        band={null}
        error={params.error}
        sent={params.sent === "1"}
      />
      <MyFeedbackList items={myFeedback} />
    </div>
  );
}
