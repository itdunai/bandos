"use server";

import {
  COOKIE_CONSENT_ACCEPTED,
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
} from "@/lib/legal/cookie-consent";
import { cookies } from "next/headers";

export async function acceptCookieConsent() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CONSENT_COOKIE, COOKIE_CONSENT_ACCEPTED, {
    path: "/",
    maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
