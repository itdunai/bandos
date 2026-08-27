export const COOKIE_CONSENT_STORAGE_KEY = "bandos-cookie-consent";
export const COOKIE_CONSENT_ACCEPTED = "accepted";

export function isCookieConsentAccepted(value: string | null | undefined): boolean {
  return value === COOKIE_CONSENT_ACCEPTED;
}
