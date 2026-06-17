import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    build: {
      sha: process.env.BUILD_SHA ?? "dev",
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
    features: { platformAdmin: true },
  });
}
