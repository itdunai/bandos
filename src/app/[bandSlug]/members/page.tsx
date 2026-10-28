import { AppShell } from "@/components/layout/app-shell";
import { ExcludeMemberButton } from "@/components/members/exclude-member-button";
import { InviteForm } from "@/components/members/invite-form";
import { MemberPermissionsEditor } from "@/components/members/member-permissions-editor";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { INSTRUMENT_LABELS, type Instrument } from "@/types/database";
import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
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

  const { data: members } = await supabase
    .from("band_members")
    .select("*, profiles(avatar_url)")
    .eq("band_id", band.id)
    .eq("is_active", true)
    .order("created_at");

  const showInvite = member ? canInviteMembers(member) : false;
  const showPermissions = member ? canManagePermissions(member) : false;

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

      <div
        className={
          showInvite ? "grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : "max-w-3xl"
        }
      >
        {/* Состав — главное на странице */}
        <section className="min-w-0 self-start rounded-xl border border-border bg-bg-2">
          <div className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-wide">Состав</h2>
            <span className="text-xs text-text-muted">{members?.length ?? 0}</span>
          </div>
          <ul className="divide-y divide-border">
            {members?.map((m, i) => {
              const profile = m.profiles as { avatar_url: string | null } | null;
              const avatarUrl = profile?.avatar_url ?? null;
              const isMe = m.user_id === member?.user_id;
              const canManage = showPermissions && m.role !== "admin";

              return (
                <li key={m.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={m.display_name ?? "?"}
                      src={avatarUrl}
                      color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                      className="h-11 w-11 shrink-0 text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-semibold">{m.display_name}</span>
                        {isMe && (
                          <Link
                            href={bandPath(band.slug, "account")}
                            className="text-xs text-text-muted hover:text-accent"
                          >
                            это вы · профиль
                          </Link>
                        )}
                        <Badge
                          variant={
                            m.role === "admin" || m.permission_preset === "administrator"
                              ? "purple"
                              : m.permission_preset === "manager"
                                ? "amber"
                                : "blue"
                          }
                        >
                          {presetBadgeLabel(m)}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-sm text-text-secondary">
                        {INSTRUMENT_LABELS[m.instrument as Instrument]}
                      </div>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 text-sm sm:flex">
                      {m.phone && (
                        <a
                          href={`tel:${m.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-accent"
                        >
                          <Phone className="h-3.5 w-3.5 text-text-muted" />
                          {m.phone}
                        </a>
                      )}
                      {m.telegram && (
                        <a
                          href={telegramUrl(m.telegram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-accent"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-text-muted" />
                          @{m.telegram.replace(/^@/, "")}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Контакты на телефоне — под именем */}
                  {(m.phone || m.telegram) && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-14 text-sm sm:hidden">
                      {m.phone && (
                        <a
                          href={`tel:${m.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-text-secondary"
                        >
                          <Phone className="h-3.5 w-3.5 text-text-muted" />
                          {m.phone}
                        </a>
                      )}
                      {m.telegram && (
                        <a
                          href={telegramUrl(m.telegram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-text-secondary"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-text-muted" />
                          @{m.telegram.replace(/^@/, "")}
                        </a>
                      )}
                    </div>
                  )}

                  {canManage && (
                    <div className="mt-2 flex items-start gap-2 pl-12">
                      <div className="min-w-0 flex-1">
                        <MemberPermissionsEditor member={m} bandId={band.id} bandSlug={band.slug} />
                      </div>
                      {!isMe && (
                        <ExcludeMemberButton
                          memberId={m.id}
                          memberName={m.display_name ?? "участника"}
                          bandId={band.id}
                          bandSlug={band.slug}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {showInvite && (
          <div className="flex min-w-0 flex-col gap-5">
            <InviteForm bandId={band.id} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
