import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BandPermissions,
  Instrument,
  MemberRole,
  PermissionPreset,
} from "@/types/database";

export interface InvitationPreview {
  id: string;
  token: string;
  email: string | null;
  role: MemberRole;
  instrument: Instrument;
  permission_preset: PermissionPreset;
  permissions: BandPermissions;
  band_name: string;
  band_slug: string;
}

export async function fetchInvitationByToken(
  supabase: SupabaseClient,
  token: string
): Promise<InvitationPreview | null> {
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error || !data) return null;
  return data as InvitationPreview;
}
