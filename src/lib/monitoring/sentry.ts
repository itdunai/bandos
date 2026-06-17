import * as Sentry from "@sentry/nextjs";

interface CaptureServerErrorOptions {
  action: string;
  userId?: string | null;
  bandId?: string | null;
  extras?: Record<string, unknown>;
}

export function captureServerError(
  error: unknown,
  { action, userId, bandId, extras }: CaptureServerErrorOptions
) {
  const hasDsn = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!hasDsn) return;

  Sentry.withScope((scope) => {
    scope.setTag("action", action);
    scope.setTag("build_sha", process.env.BUILD_SHA ?? "dev");
    if (bandId) scope.setTag("band_id", bandId);
    if (userId) scope.setUser({ id: userId });
    if (extras) scope.setExtras(extras);
    Sentry.captureException(error);
  });
}
