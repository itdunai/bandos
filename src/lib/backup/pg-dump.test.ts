import { describe, expect, it } from "vitest";
import { backupFileName, decryptBackup, encryptBackup, pgEnvFromUrl } from "@/lib/backup/pg-dump";

describe("pgEnvFromUrl", () => {
  it("splits a pooler URL into libpq variables", () => {
    expect(
      pgEnvFromUrl("postgresql://postgres.abcd:p%40ss%2Fword@aws-0-eu.pooler.supabase.com:5432/postgres")
    ).toEqual({
      PGHOST: "aws-0-eu.pooler.supabase.com",
      PGPORT: "5432",
      PGUSER: "postgres.abcd",
      PGPASSWORD: "p@ss/word",
      PGDATABASE: "postgres",
      PGSSLMODE: "require",
    });
  });

  it("rejects non-postgres URLs", () => {
    expect(() => pgEnvFromUrl("https://example.com")).toThrow();
  });
});

describe("backup encryption", () => {
  const data = Buffer.from("PGDMP fake dump body ".repeat(100));

  it("round-trips with the right passphrase", () => {
    const enc = encryptBackup(data, "correct horse battery");
    expect(enc.subarray(0, 8).toString()).toBe("BANDOSB1");
    expect(enc.includes(Buffer.from("PGDMP"))).toBe(false);
    expect(decryptBackup(enc, "correct horse battery").equals(data)).toBe(true);
  });

  it("fails with a wrong passphrase", () => {
    const enc = encryptBackup(data, "correct horse battery");
    expect(() => decryptBackup(enc, "wrong passphrase!!")).toThrow();
  });
});

describe("backupFileName", () => {
  it("is sortable and marks encryption", () => {
    const d = new Date("2026-10-29T03:05:00Z");
    expect(backupFileName(d)).toBe("bandos-2026-10-29-0305.dump");
    expect(backupFileName(d, true)).toBe("bandos-2026-10-29-0305.dump.enc");
  });
});
