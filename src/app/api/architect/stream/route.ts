import { NextRequest } from "next/server";
import { runArchitectPipeline } from "@/lib/agents/architect";
import type { ArchitectInput } from "@/lib/agents/architect";
import type { ArchitectSSEEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const opportunityId = request.nextUrl.searchParams.get("opportunityId");
  const scanId = request.nextUrl.searchParams.get("scanId");

  if (!opportunityId && !scanId) {
    return new Response(
      JSON.stringify({ error: "opportunityId or scanId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const input: ArchitectInput = scanId
    ? { type: "masterIdea", scanId }
    : { type: "opportunity", opportunityId: opportunityId! };

  const STREAM_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes — document generation can take 20+ min with retries

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

      const sendEvent = (event: ArchitectSSEEvent) => {
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
            type: "error",
            message: `Stream timed out after ${elapsed} seconds. The analysis may still be running in the background.`,
          });
          closeStream();
        }
      }, STREAM_TIMEOUT_MS);

      runArchitectPipeline(input, sendEvent)
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
          sendEvent({ type: "error", message });
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
