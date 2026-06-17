import {
  PERMISSION_LABELS,
  type BandPermission,
} from "@/lib/band/permissions";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export type ForbiddenReason =
  | "not_member"
  | "no_permission"
  | "admin_required"
  | "platform_admin"
  | "not_found";

export interface ForbiddenRedirectOptions {
  reason: ForbiddenReason;
  permission?: BandPermission;
  bandSlug?: string;
  back?: string;
}

export function redirectForbidden(options: ForbiddenRedirectOptions): never {
  const params = new URLSearchParams();
  params.set("reason", options.reason);
  if (options.permission) params.set("permission", options.permission);
  if (options.bandSlug) params.set("band", options.bandSlug);
  if (options.back) params.set("back", options.back);
  redirect(`/forbidden?${params.toString()}`);
}

export function getForbiddenMessage(searchParams: {
  reason?: string;
  permission?: string;
  band?: string;
}): { title: string; description: string } {
  const reason = searchParams.reason as ForbiddenReason | undefined;
  const permission = searchParams.permission as BandPermission | undefined;
  const bandSlug = searchParams.band;
  const bandHint = bandSlug ? ` группы «${decodeURIComponent(bandSlug)}»` : "";

  switch (reason) {
    case "not_member":
      return {
        title: "Нет доступа к группе",
        description: `Вы не состоите${bandHint}. Попросите администратора группы отправить приглашение или выберите другую группу в меню.`,
      };
    case "no_permission": {
      const section = permission ? PERMISSION_LABELS[permission] : "этот раздел";
      return {
        title: "Недостаточно прав",
        description: `У вашей роли нет доступа к разделу «${section}». Обратитесь к администратору группы, если считаете, что это ошибка.`,
      };
    }
    case "admin_required":
      return {
        title: "Только для администратора группы",
        description:
          "Это действие может выполнить создатель группы или участник с правами администратора.",
      };
    case "platform_admin":
      return {
        title: "Платформенная админка",
        description:
          "Раздел /admin доступен только владельцам проекта. Если вы администратор — проверьте PLATFORM_ADMIN_EMAILS и флаг is_platform_admin.",
      };
    case "not_found":
      return {
        title: "Раздел недоступен",
        description:
          "Запрошенный ресурс не найден или у вас нет к нему доступа.",
      };
    default:
      return {
        title: "Нет доступа",
        description:
          "У вас нет прав для просмотра этой страницы. Вернитесь назад или на главную.",
      };
  }
}

export function forbiddenBackPath(searchParams: {
  back?: string;
  band?: string;
}): string {
  const back = sanitizeRedirectPath(searchParams.back);
  if (back) return back;
  if (searchParams.band) return `/${encodeURIComponent(searchParams.band)}`;
  return "/";
}
