import { runScoutPipeline, runScoutIdeaPipeline } from "@/lib/agents/scout";
import type { AppStore, ScoutSSEEvent, ScoutFilterSettings, ScoutMode } from "@/lib/types";
import { DEFAULT_SCOUT_FILTERS } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get("store") as AppStore | null;
  const mode = (searchParams.get("mode") ?? "category") as ScoutMode;
  const category = searchParams.get("category");
  const ideaText = searchParams.get("ideaText");

  if (!store) {
    return new Response(
      JSON.stringify({ error: "Missing store parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (store !== "google_play" && store !== "app_store") {
    return new Response(
      JSON.stringify({ error: "Invalid store parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate based on mode
  if (mode === "idea" && !ideaText) {
    return new Response(
      JSON.stringify({ error: "Missing ideaText parameter for idea mode" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (mode === "category" && !category) {
    return new Response(
      JSON.stringify({ error: "Missing category parameter for category mode" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse optional filter settings from query params
  const filters: ScoutFilterSettings = {
    minInstalls: parseInt(searchParams.get("minInstalls") ?? "", 10) || DEFAULT_SCOUT_FILTERS.minInstalls,
    maxRating: parseFloat(searchParams.get("maxRating") ?? "") || DEFAULT_SCOUT_FILTERS.maxRating,
    minRatings: parseInt(searchParams.get("minRatings") ?? "", 10) || DEFAULT_SCOUT_FILTERS.minRatings,
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: ScoutSSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        if (mode === "idea" && ideaText) {
          await runScoutIdeaPipeline(store, ideaText, sendEvent, filters);
        } else {
          await runScoutPipeline(store, category!, sendEvent, filters);
        }
      } catch (error) {
        const errorEvent: ScoutSSEEvent = {
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
        const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
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
