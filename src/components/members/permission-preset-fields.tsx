"use client";

import {
  BAND_PERMISSIONS,
  PERMISSION_LABELS,
  PRESET_META,
  type BandPermissions,
  type PermissionPreset,
} from "@/lib/band/permissions";
import { cn } from "@/lib/utils";

const PRESETS = ["musician", "editor", "manager", "custom"] as const;

export function PermissionPresetFields({
  namePrefix = "",
  defaultPreset = "musician",
  defaultPermissions = {},
}: {
  namePrefix?: string;
  defaultPreset?: PermissionPreset;
  defaultPermissions?: BandPermissions;
}) {
  const presetName = `${namePrefix}permission_preset`;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs text-text-secondary">Группа прав</p>
        <div className="space-y-2">
          {PRESETS.map((preset) => {
            const meta =
              preset === "custom"
                ? { label: "Свои права", description: "Выбрать разрешения вручную" }
                : PRESET_META[preset];

            return (
              <label
                key={preset}
                className="flex cursor-pointer gap-2 rounded-lg border border-border bg-bg-3 px-3 py-2 transition-colors has-[:checked]:border-accent/50"
              >
                <input
                  type="radio"
                  name={presetName}
                  value={preset}
                  defaultChecked={defaultPreset === preset}
                  className="mt-0.5 accent-accent"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{meta.label}</span>
                  <span className="block text-[11px] text-text-muted">
                    {meta.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border px-3 py-2">
        <p className="mb-2 text-[11px] text-text-muted">
          Для «Свои права» отметьте разрешения:
        </p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {BAND_PERMISSIONS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-2 text-xs text-text-secondary"
              )}
            >
              <input
                type="checkbox"
                name={`${namePrefix}perm_${key}`}
                defaultChecked={defaultPermissions[key] === true}
                className="accent-accent"
              />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
