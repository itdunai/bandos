import { describe, expect, it } from "vitest";
import { parseDocument, parseInline } from "@/lib/legal/parse-document";
import {
  cookieConsentSetValue,
  isCookieConsentAccepted,
} from "@/lib/legal/cookie-consent";
import { isReservedBandSlug } from "@/lib/paths";

describe("parseDocument", () => {
  it("parses headings, paragraphs, lists and inline marks", () => {
    const blocks = parseDocument(
      [
        "# Title",
        "",
        "Hello **bold** and *em*.",
        "",
        "## Section",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
      ].join("\n")
    );

    expect(blocks[0]).toMatchObject({ type: "h1" });
    expect(blocks.some((b) => b.type === "h2")).toBe(true);
    expect(blocks.some((b) => b.type === "ul")).toBe(true);
    expect(blocks.some((b) => b.type === "ol")).toBe(true);

    const paragraph = blocks.find((b) => b.type === "p");
    expect(paragraph?.type).toBe("p");
    if (paragraph?.type === "p") {
      expect(paragraph.spans.map((s) => s.type)).toEqual([
        "text",
        "strong",
        "text",
        "em",
        "text",
      ]);
    }
  });

  it("keeps HTML-looking text as plain text", () => {
    const spans = parseInline("Hello <script>alert(1)</script>");
    expect(spans).toEqual([
      { type: "text", value: "Hello <script>alert(1)</script>" },
    ]);
  });
});

describe("cookie consent", () => {
  it("accepts only the stored accepted value", () => {
    expect(isCookieConsentAccepted("accepted")).toBe(true);
    expect(isCookieConsentAccepted("denied")).toBe(false);
    expect(isCookieConsentAccepted(null)).toBe(false);
  });

  it("builds a path-scoped consent cookie", () => {
    expect(cookieConsentSetValue()).toContain("bandos_cookie_consent=accepted");
    expect(cookieConsentSetValue()).toContain("Path=/");
  });
});

describe("reserved slugs", () => {
  it("reserves privacy so a band cannot take the URL", () => {
    expect(isReservedBandSlug("privacy")).toBe(true);
    expect(isReservedBandSlug("admin")).toBe(true);
  });
});
