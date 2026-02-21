import { NextRequest } from "next/server";
import { cancelScoutPipeline } from "@/lib/agents/scout";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scanId = body.scanId as string | undefined;

  if (!scanId) {
    return Response.json({ error: "scanId is required" }, { status: 400 });
  }

  const cancelled = cancelScoutPipeline(scanId);
  return Response.json({ ok: true, cancelled });
}
