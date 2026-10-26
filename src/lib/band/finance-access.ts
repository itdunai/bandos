import { canViewFinances } from "@/lib/band/permissions";
import { redirectForbidden } from "@/lib/forbidden";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Page guard: members with finances view or admins */
export async function assertFinanceView(bandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("band_members")
    .select("*")
    .eq("band_id", bandId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member || !canViewFinances(member)) {
    redirectForbidden({ reason: "no_permission", permission: "finances" });
  }
  return { supabase, user, member };
}
