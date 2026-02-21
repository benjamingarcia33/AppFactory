import { NextRequest } from "next/server";
import { cancelAllActive, runArchitectPipeline } from "@/lib/agents/architect";
import type { ArchitectSSEEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const opportunityId = request.nextUrl.searchParams.get("opportunityId");

  if (!opportunityId) {
    return new Response(
      JSON.stringify({ error: "opportunityId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Cancel any previously running pipelines before starting a new one
  cancelAllActive();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: ArchitectSSEEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream may be closed; ignore write errors
        }
      };

      runArchitectPipeline(opportunityId, sendEvent)
        .then(() => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Pipeline failed unexpectedly";
          sendEvent({ type: "error", message });
          try {
            controller.close();
          } catch {
            // Already closed
          }
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
