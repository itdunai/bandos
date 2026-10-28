import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/supabase/public-routes";

describe("isPublicPath", () => {
  it.each([
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/auth/callback",
    "/invite/abc",
    "/rider/my-band",
    "/repertoire/my-band",
    "/privacy",
    "/account/deleted",
  ])("%s is public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    "/account",
    "/reset-password",
    "/feedback",
    "/new-band",
    "/admin",
    "/my-band",
    "/my-band/songs",
    "/account/deleted/extra",
  ])("%s requires login", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
