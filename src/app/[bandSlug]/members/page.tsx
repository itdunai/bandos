import { AppShell } from "@/components/layout/app-shell";
import { ExcludeMemberButton } from "@/components/members/exclude-member-button";
import { InviteForm } from "@/components/members/invite-form";
import { MemberPermissionsEditor } from "@/components/members/member-permissions-editor";
import { MemberProfileForm } from "@/components/members/member-profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  canInviteMembers,
  canManagePermissions,
  presetBadgeLabel,
} from "@/lib/band/permissions";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import { INSTRUMENT_LABELS, type Instrument } from "@/types/database";
import { MessageCircle, Phone } from "lucide-react";
import { notFound } from "next/navigation";

const AVATAR_COLORS = ["accent", "blue", "green", "amber"] as const;

function telegramUrl(username: string) {
  const clean = username.replace(/^@/, "");
  return `https://t.me/${clean}`;
}

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const [{ data: members }, profileResult] = await Promise.all([
    supabase
      .from("band_members")
      .select("*, profiles(avatar_url)")
      .eq("band_id", band.id)
      .eq("is_active", true)
      .order("created_at"),
    member
      ? supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", member.user_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const showInvite = member ? canInviteMembers(member) : false;
  const showPermissions = member ? canManagePermissions(member) : false;
  const myAvatarUrl = profileResult.data?.avatar_url ?? null;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Участники"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}

      {member && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card className="h-full">
            <h3 className="mb-3 text-sm font-medium">Мой профиль</h3>
            <MemberProfileForm
              member={member}
              bandSlug={band.slug}
              avatarUrl={myAvatarUrl}
            />
          </Card>

          {showInvite && <InviteForm bandId={band.id} />}
        </div>
      )}

      <h3 className="mb-3 text-xs uppercase tracking-wider text-text-muted">Состав</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {members?.map((m, i) => {
          const profile = m.profiles as { avatar_url: string | null } | null;
          const avatarUrl = profile?.avatar_url ?? null;

          return (
          <div
            key={m.id}
            className="flex flex-col items-center rounded-xl border border-border bg-bg-2 p-4 text-center transition-colors hover:border-accent/50"
          >
            <Avatar
              name={m.display_name ?? "?"}
              src={avatarUrl}
              color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              className="mb-2 h-12 w-12 text-base"
            />
            <div className="text-sm font-medium">{m.display_name}</div>
            <div className="text-[11px] text-text-secondary">
              {INSTRUMENT_LABELS[m.instrument as Instrument]}
            </div>
            <div className="mt-2">
              <Badge
                variant={
                  m.role === "admin"
                    ? "purple"
                    : m.permission_preset === "administrator"
                      ? "purple"
                      : m.permission_preset === "manager"
                      ? "amber"
                      : "blue"
                }
              >
                {presetBadgeLabel(m)}
              </Badge>
            </div>

            <div className="mt-3 w-full space-y-1.5 border-t border-border pt-3 text-left">
              <div className="flex items-center gap-2 text-[11px]">
                <Phone className="h-3 w-3 shrink-0 text-text-muted" />
                {m.phone ? (
                  <a
                    href={`tel:${m.phone.replace(/\s/g, "")}`}
                    className="truncate text-text-secondary hover:text-accent"
                  >
                    {m.phone}
                  </a>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <MessageCircle className="h-3 w-3 shrink-0 text-text-muted" />
                {m.telegram ? (
                  <a
                    href={telegramUrl(m.telegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-text-secondary hover:text-accent"
                  >
                    @{m.telegram.replace(/^@/, "")}
                  </a>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
            </div>

            {showPermissions && m.role !== "admin" && (
              <MemberPermissionsEditor
                member={m}
                bandId={band.id}
                bandSlug={band.slug}
              />
            )}

            {showPermissions && m.role !== "admin" && m.user_id !== member?.user_id && (
              <ExcludeMemberButton
                memberId={m.id}
                memberName={m.display_name ?? "участника"}
                bandId={band.id}
                bandSlug={band.slug}
              />
            )}
          </div>
          );
        })}
      </div>
    </AppShell>
  );
}
