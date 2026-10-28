import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}));

import { GET } from "@/app/auth/callback/route";

const ORIGIN = "https://bandos.example";

async function location(query: string) {
  const res = await GET(new Request(`${ORIGIN}/auth/callback?${query}`));
  return res.headers.get("location");
}

describe("GET /auth/callback — token_hash links", () => {
  beforeEach(() => {
    verifyOtp.mockReset();
    exchangeCodeForSession.mockReset();
  });

  it("sends a verified recovery link to the new-password page", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    expect(await location("next=/reset-password&token_hash=abc&type=recovery")).toBe(
      `${ORIGIN}/reset-password`
    );
    expect(verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "abc" });
  });

  it("keeps the invite path after signup confirmation", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    expect(
      await location(`next=${encodeURIComponent("/invite/tok")}&token_hash=abc&type=email`)
    ).toBe(`${ORIGIN}/invite/tok`);
  });

  it("ignores an open-redirect next", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    expect(await location("next=//evil.com&token_hash=abc&type=email")).toBe(`${ORIGIN}/`);
  });

  it("asks for a new link when the recovery token is expired", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    expect(await location("token_hash=abc&type=recovery")).toMatch(
      new RegExp(`^${ORIGIN}/forgot-password\\?error=`)
    );
  });

  it("rejects unknown types without calling Supabase", async () => {
    expect(await location("token_hash=abc&type=weird")).toMatch(/\/login\?error=/);
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});

describe("GET /auth/callback — PKCE code", () => {
  beforeEach(() => exchangeCodeForSession.mockReset());

  it("exchanges the code and follows next", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(await location("code=xyz&next=/new-band")).toBe(`${ORIGIN}/new-band`);
  });

  it("sends a failed recovery exchange back to forgot-password", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad verifier" } });
    expect(await location("code=xyz&next=/reset-password")).toMatch(/\/forgot-password\?error=/);
  });
});
