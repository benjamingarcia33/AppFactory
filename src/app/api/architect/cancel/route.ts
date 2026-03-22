import { NextRequest } from "next/server";
import { cancelArchitectPipeline } from "@/lib/agents/architect";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const analysisId = body.analysisId as string | undefined;

  if (!analysisId) {
    return Response.json({ error: "analysisId is required" }, { status: 400 });
  }

  // 1. Try to abort the in-memory pipeline (works if server hasn't restarted)
  const abortedInMemory = cancelArchitectPipeline(analysisId);

  // 2. Always mark as cancelled in the DB — this is the persistent kill switch.
  //    The pipeline's catch handler will also try to set "cancelled", but if the
  //    server restarted and there's no in-memory controller, this DB write is
  //    the only thing that prevents the analysis from looking "running" forever.
  if (!abortedInMemory) {
    await db
      .update(analyses)
      .set({
        status: "cancelled",
        completedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(analyses.id, analysisId),
          inArray(analyses.status, ["running", "pending"]),
        )
      );
  }

  return Response.json({ ok: true, cancelled: true });
}
