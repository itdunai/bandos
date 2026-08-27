export const COOKIE_CONSENT_COOKIE = "bandos_cookie_consent";
export const COOKIE_CONSENT_ACCEPTED = "accepted";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isCookieConsentAccepted(value: string | null | undefined): boolean {
  return value === COOKIE_CONSENT_ACCEPTED;
}

export function cookieConsentSetValue(): string {
  return [
    `${COOKIE_CONSENT_COOKIE}=${COOKIE_CONSENT_ACCEPTED}`,
    "Path=/",
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}
