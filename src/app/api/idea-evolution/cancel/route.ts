import { NextRequest } from "next/server";
import { cancelIdeaEvolution } from "@/lib/agents/idea-evolution";
import { db } from "@/lib/db";
import { ideaEvolutions } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const evolutionId = body.evolutionId as string | undefined;

  if (!evolutionId) {
    return Response.json({ error: "evolutionId is required" }, { status: 400 });
  }

  // 1. Try to abort the in-memory pipeline (works if server hasn't restarted)
  const abortedInMemory = cancelIdeaEvolution(evolutionId);

  // 2. Always mark as cancelled in the DB — this is the persistent kill switch.
  //    The pipeline's catch handler will also try to set "cancelled", but if the
  //    server restarted and there's no in-memory controller, this DB write is
  //    the only thing that prevents the evolution from looking "running" forever.
  if (!abortedInMemory) {
    await db
      .update(ideaEvolutions)
      .set({
        status: "cancelled",
        completedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(ideaEvolutions.id, evolutionId),
          inArray(ideaEvolutions.status, ["pending", "analyzing", "generating"]),
        )
      );
  }

  return Response.json({ ok: true, cancelled: true });
}
