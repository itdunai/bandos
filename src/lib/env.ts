import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  BUILD_SHA: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
});

let validated = false;

function isBuildTime() {
  return process.env.npm_lifecycle_event === "build";
}

export function validateRuntimeEnv() {
  if (validated || isBuildTime()) return;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid env configuration: ${parsed.error.issues[0]?.message ?? "unknown"}`
    );
  }

  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    const required: Array<[key: string, value: string | undefined]> = [
      ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
      ["NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL],
    ];

    const missing = required.filter(([, value]) => !value).map(([key]) => key);
    if (missing.length > 0) {
      throw new Error(
        `Missing required env vars in production: ${missing.join(", ")}`
      );
    }
  }

  validated = true;
}
