import { describe, expect, it } from "vitest";
import {
  canViewFinances,
  hasPermission,
  isBandAdmin,
  isBandOwner,
  normalizePermissions,
  parsePermissionsPayload,
  permissionsFromPreset,
} from "@/lib/band/permissions";
import type { BandMember } from "@/types/database";

function member(overrides: Partial<BandMember> = {}): BandMember {
  return {
    id: "m1",
    band_id: "b1",
    user_id: "u1",
    role: "member",
    instrument: "guitar",
    display_name: null,
    phone: null,
    telegram: null,
    is_active: true,
    permission_preset: "musician",
    permissions: {},
    ...overrides,
  };
}

describe("isBandAdmin", () => {
  it("admin role is admin", () => {
    expect(isBandAdmin(member({ role: "admin" }))).toBe(true);
  });

  it("administrator preset is admin", () => {
    expect(
      isBandAdmin(member({ permission_preset: "administrator" }))
    ).toBe(true);
  });

  it("musician is not admin", () => {
    expect(isBandAdmin(member({ permission_preset: "musician" }))).toBe(false);
  });
});

describe("hasPermission", () => {
  it("admin has all permissions", () => {
    expect(hasPermission(member({ role: "admin" }), "songs")).toBe(true);
    expect(hasPermission(member({ role: "admin" }), "finances")).toBe(true);
  });

  it("editor can edit songs", () => {
    const m = member({
      permission_preset: "editor",
      permissions: permissionsFromPreset("editor"),
    });
    expect(hasPermission(m, "songs")).toBe(true);
    expect(hasPermission(m, "schedule")).toBe(false);
  });

  it("manager can view finances flag but custom permissions work", () => {
    const m = member({
      permission_preset: "manager",
      permissions: permissionsFromPreset("manager"),
    });
    expect(hasPermission(m, "finances")).toBe(true);
    expect(hasPermission(m, "todos")).toBe(true);
  });

  it("custom permissions from JSON", () => {
    const m = member({
      permission_preset: "custom",
      permissions: { schedule: true },
    });
    expect(hasPermission(m, "schedule")).toBe(true);
    expect(hasPermission(m, "songs")).toBe(false);
  });
});

describe("canViewFinances", () => {
  it("manager preset can view", () => {
    const m = member({
      permission_preset: "manager",
      permissions: permissionsFromPreset("manager"),
    });
    expect(canViewFinances(m)).toBe(true);
  });

  it("musician cannot view", () => {
    expect(canViewFinances(member())).toBe(false);
  });
});

describe("isBandOwner", () => {
  it("only role admin", () => {
    expect(isBandOwner(member({ role: "admin" }))).toBe(true);
    expect(
      isBandOwner(member({ role: "member", permission_preset: "administrator" }))
    ).toBe(false);
  });
});

describe("normalizePermissions", () => {
  it("strips unknown keys and false values", () => {
    expect(
      normalizePermissions({ songs: true, schedule: false, todos: true })
    ).toEqual({ songs: true, todos: true });
  });
});

describe("parsePermissionsPayload", () => {
  it("uses preset defaults", () => {
    const result = parsePermissionsPayload("editor", new FormData());
    expect(result.preset).toBe("editor");
    expect(result.permissions).toEqual({ songs: true, setlists: true });
  });

  it("reads custom checkboxes", () => {
    const form = new FormData();
    form.set("perm_schedule", "on");
    const result = parsePermissionsPayload("custom", form);
    expect(result.permissions).toEqual({ schedule: true });
  });
});
