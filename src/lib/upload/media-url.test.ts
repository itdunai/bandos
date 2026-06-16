import { describe, expect, it } from "vitest";
import {
  displayUrlWithCacheBust,
  isLocalMediaUrl,
  isSupabaseMediaUrl,
  pathFromSupabasePublicUrl,
  stripCacheParam,
} from "@/lib/upload/media-url";

describe("isLocalMediaUrl", () => {
  it("detects /media/ prefix", () => {
    expect(isLocalMediaUrl("/media/bands/x/logo.webp")).toBe(true);
    expect(isLocalMediaUrl("https://example.com/x")).toBe(false);
  });
});

describe("isSupabaseMediaUrl", () => {
  it("detects public storage URLs", () => {
    expect(
      isSupabaseMediaUrl(
        "https://abc.supabase.co/storage/v1/object/public/band-media/bands/x/logo.webp"
      )
    ).toBe(true);
    expect(isSupabaseMediaUrl("/media/bands/x/logo.webp")).toBe(false);
  });
});

describe("stripCacheParam", () => {
  it("removes query string", () => {
    expect(stripCacheParam("https://x/y.webp?v=123")).toBe("https://x/y.webp");
  });
});

describe("pathFromSupabasePublicUrl", () => {
  it("extracts storage path", () => {
    expect(
      pathFromSupabasePublicUrl(
        "https://abc.supabase.co/storage/v1/object/public/band-media/bands/b1/logo.webp?v=1"
      )
    ).toBe("bands/b1/logo.webp");
  });
});

describe("displayUrlWithCacheBust", () => {
  it("adds version query", () => {
    const url = displayUrlWithCacheBust("https://x/y.webp");
    expect(url).toMatch(/^https:\/\/x\/y\.webp\?v=\d+$/);
  });
});
