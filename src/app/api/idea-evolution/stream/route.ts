import { NextRequest } from "next/server";
import { runIdeaEvolutionPipeline } from "@/lib/agents/idea-evolution";
import type { IdeaEvolutionSSEEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const analysisId = request.nextUrl.searchParams.get("analysisId");
  const idea = request.nextUrl.searchParams.get("idea");

  if (!analysisId || !idea) {
    return new Response(
      JSON.stringify({ error: "analysisId and idea are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const streamStartTime = Date.now();
      let streamClosed = false;

      const closeStream = () => {
        if (!streamClosed) {
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      };

      const sendEvent = (event: IdeaEvolutionSSEEvent) => {
        if (streamClosed) return;
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream may be closed; ignore write errors
        }
      };

      // Set up stream timeout
      const timeoutId = setTimeout(() => {
        if (!streamClosed) {
          const elapsed = Math.round((Date.now() - streamStartTime) / 1000);
          sendEvent({
            type: "idea_error",
            evolutionId: "",
            message: `Stream timed out after ${elapsed} seconds. The evolution may still be running in the background.`,
          });
          closeStream();
        }
      }, STREAM_TIMEOUT_MS);

      runIdeaEvolutionPipeline({ analysisId, ideaText: idea }, sendEvent)
        .then(() => {
          clearTimeout(timeoutId);
          closeStream();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          const message =
            error instanceof Error
              ? error.message
              : "Pipeline failed unexpectedly";
          sendEvent({ type: "idea_error", evolutionId: "", message });
          closeStream();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
