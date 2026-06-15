import { readLocalMediaFile } from "@/lib/upload/local-storage";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const result = await readLocalMediaFile(segments.join("/"));

  if ("error" in result) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
