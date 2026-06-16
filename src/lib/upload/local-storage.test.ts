import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteLocalMediaUrl,
  isLocalMediaUrl,
  publicUrlForStoragePath,
  readLocalMediaFile,
  writeLocalMedia,
} from "@/lib/upload/local-storage";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "bandos-upload-"));
  process.env.UPLOAD_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.UPLOAD_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("isLocalMediaUrl", () => {
  it("detects /media/ prefix", () => {
    expect(isLocalMediaUrl("/media/bands/x/logo.webp")).toBe(true);
    expect(isLocalMediaUrl("https://example.com/x")).toBe(false);
  });
});

describe("publicUrlForStoragePath", () => {
  it("builds public URL", () => {
    expect(publicUrlForStoragePath("bands/b1/logo.webp")).toBe(
      "/media/bands/b1/logo.webp"
    );
  });
});

describe("writeLocalMedia / readLocalMediaFile", () => {
  it("writes and reads a file", async () => {
    const written = await writeLocalMedia(
      "bands/b1/logo.webp",
      Buffer.from("webp-data")
    );
    expect("publicUrl" in written).toBe(true);
    if (!("publicUrl" in written)) return;

    const read = await readLocalMediaFile("bands/b1/logo.webp");
    expect("buffer" in read).toBe(true);
    if ("buffer" in read) {
      expect(read.buffer.toString()).toBe("webp-data");
      expect(read.contentType).toBe("image/webp");
    }
  });

  it("rejects path traversal", async () => {
    const result = await writeLocalMedia(
      "../../outside.txt",
      Buffer.from("hack")
    );
    expect(result).toEqual({ error: "Некорректный путь файла" });

    const read = await readLocalMediaFile("../../outside.txt");
    expect(read).toEqual({ error: "Not found" });
  });
});

describe("deleteLocalMediaUrl", () => {
  it("removes file by public URL", async () => {
    await writeLocalMedia("bands/b1/logo.webp", Buffer.from("x"));
    await deleteLocalMediaUrl("/media/bands/b1/logo.webp");
    const read = await readLocalMediaFile("bands/b1/logo.webp");
    expect(read).toEqual({ error: "Not found" });
  });

  it("ignores non-local URLs", async () => {
    await expect(
      deleteLocalMediaUrl("https://cdn.example.com/x.webp")
    ).resolves.toBeUndefined();
  });
});
