import { NextRequest } from "next/server";
import { cancelArchitectPipeline } from "@/lib/agents/architect";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const analysisId = body.analysisId as string | undefined;

  if (!analysisId) {
    return Response.json({ error: "analysisId is required" }, { status: 400 });
  }

  const cancelled = cancelArchitectPipeline(analysisId);
  return Response.json({ ok: true, cancelled });
}
