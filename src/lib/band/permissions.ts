import type { BandMember } from "@/types/database";

/** Granular edit permissions (view is granted to all active members). */
export const BAND_PERMISSIONS = [
  "songs",
  "setlists",
  "schedule",
  "todos",
  "band_profile",
  "finances",
] as const;

export type BandPermission = (typeof BAND_PERMISSIONS)[number];

export type PermissionPreset = "musician" | "editor" | "manager" | "custom";

export type BandPermissions = Partial<Record<BandPermission, boolean>>;

export const PERMISSION_LABELS: Record<BandPermission, string> = {
  songs: "Треки",
  setlists: "Сет-листы",
  schedule: "График",
  todos: "Дела",
  band_profile: "Профиль группы",
  finances: "Финансы (просмотр)",
};

export const PRESET_META: Record<
  Exclude<PermissionPreset, "custom">,
  { label: string; description: string }
> = {
  musician: {
    label: "Музыкант",
    description: "Просмотр репертуара, сет-листов, режим «Играем»",
  },
  editor: {
    label: "Редактор",
    description: "Музыкант + редактирование треков и сет-листов",
  },
  manager: {
    label: "Менеджер",
    description: "Редактор + график, дела и профиль группы",
  },
};

const PRESET_PERMISSIONS: Record<
  Exclude<PermissionPreset, "custom">,
  BandPermissions
> = {
  musician: {},
  editor: { songs: true, setlists: true },
  manager: {
    songs: true,
    setlists: true,
    schedule: true,
    todos: true,
    band_profile: true,
    finances: true,
  },
};

export function permissionsFromPreset(
  preset: Exclude<PermissionPreset, "custom">
): BandPermissions {
  return { ...PRESET_PERMISSIONS[preset] };
}

export function normalizePermissions(
  raw: BandPermissions | null | undefined
): BandPermissions {
  const out: BandPermissions = {};
  for (const key of BAND_PERMISSIONS) {
    if (raw?.[key] === true) out[key] = true;
  }
  return out;
}

export function isBandAdmin(member: BandMember): boolean {
  return member.role === "admin";
}

export function canManagePermissions(member: BandMember): boolean {
  return isBandAdmin(member);
}

export function canInviteMembers(member: BandMember): boolean {
  return isBandAdmin(member);
}

export function canViewFinances(member: BandMember): boolean {
  return isBandAdmin(member) || hasPermission(member, "finances");
}

export function hasPermission(
  member: BandMember,
  permission: BandPermission
): boolean {
  if (isBandAdmin(member)) return true;
  const perms = normalizePermissions(
    member.permissions as BandPermissions | undefined
  );
  return perms[permission] === true;
}

export function parsePresetInput(value: string | null): PermissionPreset {
  if (
    value === "musician" ||
    value === "editor" ||
    value === "manager" ||
    value === "custom"
  ) {
    return value;
  }
  return "musician";
}

export function parsePermissionsPayload(
  preset: PermissionPreset,
  formData: FormData
): { preset: PermissionPreset; permissions: BandPermissions } {
  if (preset !== "custom") {
    return {
      preset,
      permissions: permissionsFromPreset(preset),
    };
  }

  const permissions: BandPermissions = {};
  for (const key of BAND_PERMISSIONS) {
    if (formData.get(`perm_${key}`) === "on") {
      permissions[key] = true;
    }
  }
  return { preset: "custom", permissions };
}

export function presetBadgeLabel(
  member: BandMember
): string {
  if (isBandAdmin(member)) return "Admin";
  const preset = member.permission_preset as PermissionPreset | null;
  if (preset && preset !== "custom") {
    return PRESET_META[preset].label;
  }
  return "Свои права";
}
