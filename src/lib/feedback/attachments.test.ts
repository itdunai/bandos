import { describe, expect, it } from "vitest";
import { sniffImageType } from "@/lib/feedback/attachments";

describe("sniffImageType", () => {
  it("detects PNG and JPEG by content", () => {
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
  });

  it("rejects anything else, including renamed files", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull(); // GIF
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});
